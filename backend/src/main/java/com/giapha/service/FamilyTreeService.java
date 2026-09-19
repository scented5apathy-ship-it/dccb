package com.giapha.service;

import com.giapha.exception.ForbiddenException;
import com.giapha.exception.ResourceNotFoundException;
import com.giapha.model.dto.tree.FamilyTreeResponse;
import com.giapha.model.entity.Family;
import com.giapha.model.entity.FamilyMember;
import com.giapha.model.entity.Generation;
import com.giapha.model.entity.Relationship;
import com.giapha.model.entity.RelationshipType;
import com.giapha.model.entity.User;
import com.giapha.repository.FamilyMemberRepository;
import com.giapha.repository.FamilyRepository;
import com.giapha.repository.GenerationRepository;
import com.giapha.repository.RelationshipRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Builds the nested family-tree payload for GET /api/families/{familyId}/tree.
 *
 * <p>Strategy:
 * <ol>
 *   <li>Load generations ordered ASC.</li>
 *   <li>Load all members in the family.</li>
 *   <li>Load all relationships in the family.</li>
 *   <li>For every member, compute:
 *     <ul>
 *       <li>parents — PARENT/ADOPTED/GODPARENT via outgoing + CHILD via incoming</li>
 *       <li>spouses — SPOUSE via outgoing + incoming</li>
 *       <li>siblings — SIBLING outgoing + incoming</li>
 *       <li>children — CHILD outgoing + PARENT incoming</li>
 *     </ul>
 *     The "primary" set of roots (top-of-tree) is the lowest generation number's members
 *     whose parents are all in lower generations or who have no recorded parents.</li>
 *   <li>Returns each generation with all of its members; each member carries their
 *       spouses/siblings list and a recursive children tree.</li>
 * </ol>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FamilyTreeService {

    private final FamilyRepository familyRepository;
    private final GenerationRepository generationRepository;
    private final FamilyMemberRepository memberRepository;
    private final RelationshipRepository relationshipRepository;
    private final FamilyRoleResolver roleResolver;

    public FamilyTreeResponse buildTree(UUID familyId, User user) {
        Family family = familyRepository.findById(familyId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy gia tộc"));
        if (roleResolver.resolveRole(familyId, user) == null) {
            throw new ForbiddenException("Bạn không phải thành viên của gia tộc này");
        }

        List<Generation> generations = generationRepository.findByFamily(familyId);
        List<FamilyMember> members = memberRepository.findByFamily(familyId);
        List<Relationship> relationships = relationshipRepository.findAllForFamily(familyId);

        // Indexes — single scan of members/relationships, then O(1) lookups.
        Map<UUID, FamilyMember> byId = new HashMap<>();
        for (FamilyMember m : members) byId.put(m.getId(), m);

        Map<UUID, List<Relationship>> outgoing = new HashMap<>();
        Map<UUID, List<Relationship>> incoming = new HashMap<>();
        for (Relationship r : relationships) {
            outgoing.computeIfAbsent(r.getFromMemberId(), k -> new ArrayList<>()).add(r);
            incoming.computeIfAbsent(r.getToMemberId(), k -> new ArrayList<>()).add(r);
        }

        // Group members by generation (preserve sort: birth_date ASC, then full_name).
        Map<UUID, List<FamilyMember>> byGeneration = new HashMap<>();
        for (FamilyMember m : members) {
            UUID gId = m.getGenerationId();
            if (gId == null) continue;
            byGeneration.computeIfAbsent(gId, k -> new ArrayList<>()).add(m);
        }

        Map<UUID, Integer> genNumberIndex = new HashMap<>();
        for (Generation g : generations) genNumberIndex.put(g.getId(), g.getGenerationNumber());

        // ----- Build generation nodes ----- //
        List<FamilyTreeResponse.GenerationNode> generationNodes = new ArrayList<>();
        for (Generation g : generations) {
            List<FamilyTreeResponse.TreeMemberNode> nodes = new ArrayList<>();
            for (FamilyMember m : byGeneration.getOrDefault(g.getId(), List.of())) {
                nodes.add(toMemberNode(m, outgoing, incoming, byId));
            }
            generationNodes.add(FamilyTreeResponse.GenerationNode.builder()
                .id(g.getId())
                .generationNumber(g.getGenerationNumber())
                .name(g.getName())
                .startYear(g.getStartYear())
                .endYear(g.getEndYear())
                .members(nodes)
                .build());
        }

        return FamilyTreeResponse.builder()
            .familyId(family.getId())
            .familyName(family.getName())
            .totalMembers(members.size())
            .totalGenerations(generations.size())
            .generations(generationNodes)
            .build();
    }

    /**
     * Build a recursive member node: spouses (depth 0), siblings (depth 0),
     * children (depth -1 = recursion). Uses a visited set so cycles don't loop
     * forever (rare in practice but guards bad data).
     */
    private FamilyTreeResponse.TreeMemberNode toMemberNode(
            FamilyMember m,
            Map<UUID, List<Relationship>> outgoing,
            Map<UUID, List<Relationship>> incoming,
            Map<UUID, FamilyMember> byId) {
        return toMemberNode(m, outgoing, incoming, byId, new HashSet<>());
    }

    private FamilyTreeResponse.TreeMemberNode toMemberNode(
            FamilyMember m,
            Map<UUID, List<Relationship>> outgoing,
            Map<UUID, List<Relationship>> incoming,
            Map<UUID, FamilyMember> byId,
            Set<UUID> visited) {

        visited.add(m.getId());

        FamilyTreeResponse.TreeMemberNode node = FamilyTreeResponse.TreeMemberNode.builder()
            .id(m.getId())
            .familyId(m.getFamilyId())
            .fullName(m.getFullName())
            .nickname(m.getNickname())
            .gender(m.getGender() == null ? null : m.getGender().name())
            .avatarUrl(m.getAvatarUrl())
            .birthDate(m.getBirthDate())
            .deathDate(m.getDeathDate())
            .isAlive(Boolean.TRUE.equals(m.getIsAlive()))
            .occupation(m.getOccupation())
            .generationId(m.getGenerationId())
            .build();

        List<FamilyTreeResponse.TreeMemberNode> spouses = new ArrayList<>();
        List<FamilyTreeResponse.TreeMemberNode> siblings = new ArrayList<>();
        List<FamilyTreeResponse.TreeMemberNode> children = new ArrayList<>();
        java.util.Set<UUID> seenSpouses = new java.util.LinkedHashSet<>();
        java.util.Set<UUID> seenSiblings = new java.util.LinkedHashSet<>();
        java.util.Set<UUID> seenChildren = new java.util.LinkedHashSet<>();

        addTargets(m, outgoing.getOrDefault(m.getId(), List.of()), spouses, siblings, children,
            outgoing, incoming, byId, visited, /*isOutgoing=*/true,
            seenSpouses, seenSiblings, seenChildren);
        addTargets(m, incoming.getOrDefault(m.getId(), List.of()), spouses, siblings, children,
            outgoing, incoming, byId, visited, /*isOutgoing=*/false,
            seenSpouses, seenSiblings, seenChildren);

        node.setSpouses(spouses);
        node.setSiblings(siblings);
        node.setChildren(children);
        return node;
    }

    /**
     * Walks one side of edges (either outgoing edges where {@code self} is the
     * from, or incoming edges where {@code self} is the to) and categorises
     * the other side into {@code spouses} / {@code siblings} / {@code children}
     * bags used by the tree builder.
     *
     * <p>Edge semantics (the row "from → to" carries a {@code type} meaning):</p>
     * <ul>
     *   <li>SPOUSE — symmetric: outgoing SPOUSE → target is spouse, incoming SPOUSE → source is spouse.</li>
     *   <li>SIBLING — symmetric: same as SPOUSE for tree-rendering purposes.</li>
     *   <li>PARENT — outgoing PARENT means "self is parent of target" (target is a child);
     *       incoming PARENT means "source is parent of self" (source is a parent and is
     *       <strong>not</strong> rendered under self's children list — it lives in the
     *       previous generation).</li>
     *   <li>CHILD — outgoing CHILD means "self is child of target" (target is a parent);
     *       incoming CHILD means "source is child of self" (source is a child).</li>
     *   <li>ADOPTED / GODPARENT — treated as PARENT direction-wise.</li>
     * </ul>
     */
    private void addTargets(FamilyMember self,
                             List<Relationship> edges,
                             List<FamilyTreeResponse.TreeMemberNode> spouses,
                             List<FamilyTreeResponse.TreeMemberNode> siblings,
                             List<FamilyTreeResponse.TreeMemberNode> children,
                             Map<UUID, List<Relationship>> outgoing,
                             Map<UUID, List<Relationship>> incoming,
                             Map<UUID, FamilyMember> byId,
                             Set<UUID> visited,
                             boolean isOutgoing,
                             java.util.Set<UUID> seenSpouses,
                             java.util.Set<UUID> seenSiblings,
                             java.util.Set<UUID> seenChildren) {
        for (Relationship r : edges) {
            UUID targetId = isOutgoing ? r.getToMemberId() : r.getFromMemberId();
            if (targetId.equals(self.getId())) continue;
            FamilyMember target = byId.get(targetId);
            if (target == null) continue;

            switch (r.getType()) {
                case SPOUSE -> {
                    if (!visited.contains(targetId) && seenSpouses.add(targetId)) {
                        spouses.add(toShallow(target));
                    }
                }
                case SIBLING -> {
                    if (!visited.contains(targetId) && seenSiblings.add(targetId)) {
                        siblings.add(toShallow(target));
                    }
                }
                case PARENT, ADOPTED, GODPARENT -> {
                    // Outgoing PARENT → target is a child of self (recurse).
                    // Incoming PARENT → source is a parent of self — parent lives
                    //   in a previous generation; we do not embed it here.
                    if (isOutgoing && !visited.contains(targetId) && seenChildren.add(targetId)) {
                        children.add(toMemberNode(target, outgoing, incoming, byId, copyVisited(visited)));
                    }
                }
                case CHILD -> {
                    // Outgoing CHILD → target is a parent of self (do not embed).
                    // Incoming CHILD → source is a child of self (recurse).
                    if (!isOutgoing && !visited.contains(targetId) && seenChildren.add(targetId)) {
                        children.add(toMemberNode(target, outgoing, incoming, byId, copyVisited(visited)));
                    }
                }
            }
        }
    }

    private FamilyTreeResponse.TreeMemberNode toShallow(FamilyMember m) {
        return FamilyTreeResponse.TreeMemberNode.builder()
            .id(m.getId())
            .familyId(m.getFamilyId())
            .fullName(m.getFullName())
            .nickname(m.getNickname())
            .gender(m.getGender() == null ? null : m.getGender().name())
            .avatarUrl(m.getAvatarUrl())
            .birthDate(m.getBirthDate())
            .deathDate(m.getDeathDate())
            .isAlive(Boolean.TRUE.equals(m.getIsAlive()))
            .occupation(m.getOccupation())
            .generationId(m.getGenerationId())
            .build();
    }

    private Set<UUID> copyVisited(Set<UUID> original) {
        return new HashSet<>(original);
    }
}
