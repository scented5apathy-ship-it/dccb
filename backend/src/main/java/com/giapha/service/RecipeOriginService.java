package com.giapha.service;

import com.giapha.exception.BadRequestException;
import com.giapha.exception.ResourceNotFoundException;
import com.giapha.model.dto.origin.CreateOriginRequest;
import com.giapha.model.dto.origin.GenealogyTreeResponse;
import com.giapha.model.dto.origin.OriginDto;
import com.giapha.model.entity.Recipe;
import com.giapha.model.entity.RecipeOrigin;
import com.giapha.repository.RecipeOriginRepository;
import com.giapha.repository.RecipeRepository;
import com.giapha.security.CustomUserDetails;
import com.giapha.util.AuthorizationHelper;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Owns the recipe genealogy: simple CRUD on edges plus the recursive-CTE
 * lineage walker that builds the transmission tree.
 */
@Service
public class RecipeOriginService {

    private final RecipeOriginRepository originRepository;
    private final RecipeRepository recipeRepository;
    private final AuthorizationHelper authorizationHelper;

    public RecipeOriginService(RecipeOriginRepository originRepository,
                               RecipeRepository recipeRepository,
                               AuthorizationHelper authorizationHelper) {
        this.originRepository = originRepository;
        this.recipeRepository = recipeRepository;
        this.authorizationHelper = authorizationHelper;
    }

    public OriginDto addOrigin(UUID recipeId, CreateOriginRequest req, CustomUserDetails currentUser) {
        Recipe recipe = recipeRepository.findById(recipeId)
            .orElseThrow(() -> new ResourceNotFoundException("Recipe not found: " + recipeId));
        authorizationHelper.requireFamilyMember(currentUser.getId(), recipe.getFamilyId());

        if (req.getFromMemberId().equals(req.getToMemberId())) {
            throw new BadRequestException("fromMemberId and toMemberId must differ");
        }
        if (!originRepository.bothMembersInFamily(req.getFromMemberId(), req.getToMemberId(), recipe.getFamilyId())) {
            throw new BadRequestException("Both members must belong to the recipe's family");
        }

        UUID id = originRepository.insert(RecipeOrigin.builder()
            .recipeId(recipeId)
            .fromMemberId(req.getFromMemberId())
            .toMemberId(req.getToMemberId())
            .yearTransmitted(req.getYearTransmitted())
            .generationGap(req.getGenerationGap())
            .story(req.getStory())
            .build());

        return originRepository.findDtosByRecipe(recipeId).stream()
            .filter(o -> o.getId().equals(id))
            .findFirst()
            .orElseThrow(() -> new ResourceNotFoundException("Origin not found after insert: " + id));
    }

    public List<OriginDto> listOrigins(UUID recipeId, CustomUserDetails currentUser) {
        Recipe recipe = recipeRepository.findById(recipeId)
            .orElseThrow(() -> new ResourceNotFoundException("Recipe not found: " + recipeId));
        if (!Boolean.TRUE.equals(recipe.getIsPublic())) {
            authorizationHelper.requireFamilyMember(currentUser.getId(), recipe.getFamilyId());
        }
        return originRepository.findDtosByRecipe(recipeId);
    }

    /**
     * Builds the recipe's full transmission tree. The SQL CTE produces a flat
     * list of edges ordered by depth; this method stitches them into a tree
     * where each node represents one transmission event.
     *
     * <p>Tree model:
     * <ul>
     *   <li>The root node is the originator (from_member of the root edge).</li>
     *   <li>For each edge, the node's member is the from_member (the giver),
     *       and the children are the next edges where the current recipient
     *       becomes the giver.</li>
     * </ul>
     *
     * <p>Example chain: Đức (1910) → Cương (1910) → Lan (1985) → Lan cháu (2015)
     * becomes a tree like:
     * <pre>
     *   Đức [1910]
     *     └── Cương [1985]
     *           └── Lan [2015]
     * </pre>
     */
    public GenealogyTreeResponse buildGenealogyTree(UUID recipeId, CustomUserDetails currentUser) {
        Recipe recipe = recipeRepository.findById(recipeId)
            .orElseThrow(() -> new ResourceNotFoundException("Recipe not found: " + recipeId));
        if (!Boolean.TRUE.equals(recipe.getIsPublic())) {
            authorizationHelper.requireFamilyMember(currentUser.getId(), recipe.getFamilyId());
        }

        List<RecipeOriginRepository.GenealogyRow> rows = originRepository.lineage(recipeId);
        if (rows.isEmpty()) {
            return GenealogyTreeResponse.builder()
                .recipe(GenealogyTreeResponse.RecipeRef.builder()
                    .id(recipe.getId())
                    .title(recipe.getTitle())
                    .build())
                .tree(null)
                .totalGenerations(0)
                .build();
        }

        // Bucket outgoing edges by giver (from_member). A giver's children are
        // the people they taught the recipe to.
        Map<UUID, List<RecipeOriginRepository.GenealogyRow>> outgoingByGiver = new HashMap<>();
        for (var r : rows) {
            outgoingByGiver.computeIfAbsent(r.fromMemberId(), k -> new ArrayList<>()).add(r);
        }
        outgoingByGiver.values().forEach(list -> list.sort(Comparator.comparing(
            RecipeOriginRepository.GenealogyRow::yearTransmitted,
            Comparator.nullsLast(Comparator.naturalOrder()))));

        // Identify root edges: those whose giver is not anyone's recipient.
        List<RecipeOriginRepository.GenealogyRow> rootEdges = new ArrayList<>();
        for (var r : rows) {
            boolean hasIncoming = rows.stream()
                .anyMatch(other -> other.toMemberId().equals(r.fromMemberId()));
            if (!hasIncoming) rootEdges.add(r);
        }

        // Build a forest of trees (one per disconnected root)
        int[] counters = new int[]{0, Integer.MAX_VALUE, Integer.MIN_VALUE}; // [maxDepth, oldest, newest]
        List<GenealogyTreeResponse.TreeNode> forest = new ArrayList<>();
        for (var edge : rootEdges) {
            forest.add(buildNode(edge, outgoingByGiver, counters, 0));
        }

        Integer oldest = counters[1] == Integer.MAX_VALUE ? null : counters[1];
        Integer newest = counters[2] == Integer.MIN_VALUE ? null : counters[2];

        // Pick the first tree as the primary tree (typical for family recipes).
        GenealogyTreeResponse.TreeNode primaryTree = forest.isEmpty() ? null : forest.get(0);

        return GenealogyTreeResponse.builder()
            .recipe(GenealogyTreeResponse.RecipeRef.builder()
                .id(recipe.getId())
                .title(recipe.getTitle())
                .build())
            .tree(primaryTree)
            .totalGenerations(counters[0] + 1)
            .oldestYear(oldest)
            .newestYear(newest)
            .build();
    }

    /**
     * Build a node for one transmission edge.
     *
     * <p>The node's member is the {@code from_member} (giver). The children are
     * the next transmissions where {@code to_member} of this edge becomes the
     * giver in another edge. So Đức → Cương → Lan chains into:
     * <pre>
     *   node(Đức → Cương, year=1910)
     *     └── node(Cương → Lan, year=1985)
     *           └── node(Lan → Lan cháu, year=2015)
     * </pre>
     */
    private GenealogyTreeResponse.TreeNode buildNode(RecipeOriginRepository.GenealogyRow edge,
                                                     Map<UUID, List<RecipeOriginRepository.GenealogyRow>> outgoingByGiver,
                                                     int[] counters,
                                                     int depth) {
        // Update stats
        if (edge.yearTransmitted() != null) {
            counters[1] = Math.min(counters[1], edge.yearTransmitted());
            counters[2] = Math.max(counters[2], edge.yearTransmitted());
        }
        counters[0] = Math.max(counters[0], depth);

        // Recurse: who did the recipient (toMember) teach next?
        UUID nextGiverId = edge.toMemberId();
        List<GenealogyTreeResponse.TreeNode> children = new ArrayList<>();
        for (var nextEdge : outgoingByGiver.getOrDefault(nextGiverId, List.of())) {
            children.add(buildNode(nextEdge, outgoingByGiver, counters, depth + 1));
        }

        return GenealogyTreeResponse.TreeNode.builder()
            .member(GenealogyTreeResponse.MemberRef.builder()
                .id(edge.fromMemberId())
                .fullName(edge.fromName())
                .generationNumber(edge.fromGeneration())
                .generationName(edge.fromGenerationName())
                .build())
            .year(edge.yearTransmitted())
            .story(edge.story())
            .children(children)
            .build();
    }
}