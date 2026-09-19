package com.giapha.service;

import com.giapha.exception.ResourceNotFoundException;
import com.giapha.model.dto.common.MessageResponse;
import com.giapha.model.dto.reaction.ReactionCounts;
import com.giapha.model.entity.ReactionType;
import com.giapha.model.entity.RecipeReaction;
import com.giapha.repository.RecipeReactionRepository;
import com.giapha.repository.RecipeRepository;
import com.giapha.security.CustomUserDetails;
import com.giapha.util.AuthorizationHelper;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Reaction add/remove/list logic. Public recipes are open to any authenticated
 * user; family recipes still require the user to be a member of the family.
 */
@Service
public class RecipeReactionService {

    private final RecipeReactionRepository reactionRepository;
    private final RecipeRepository recipeRepository;
    private final AuthorizationHelper authorizationHelper;

    public RecipeReactionService(RecipeReactionRepository reactionRepository,
                                 RecipeRepository recipeRepository,
                                 AuthorizationHelper authorizationHelper) {
        this.reactionRepository = reactionRepository;
        this.recipeRepository = recipeRepository;
        this.authorizationHelper = authorizationHelper;
    }

    public ReactionCounts addOrUpdate(UUID recipeId, ReactionType type, CustomUserDetails currentUser) {
        var recipe = recipeRepository.findById(recipeId)
            .orElseThrow(() -> new ResourceNotFoundException("Recipe not found: " + recipeId));
        if (!Boolean.TRUE.equals(recipe.getIsPublic())) {
            authorizationHelper.requireFamilyMember(currentUser.getId(), recipe.getFamilyId());
        }

        reactionRepository.upsert(RecipeReaction.builder()
            .recipeId(recipeId)
            .userId(currentUser.getId())
            .reactionType(type)
            .build());

        return getCounts(recipeId, currentUser);
    }

    public MessageResponse remove(UUID recipeId, CustomUserDetails currentUser) {
        var recipe = recipeRepository.findById(recipeId)
            .orElseThrow(() -> new ResourceNotFoundException("Recipe not found: " + recipeId));
        if (!Boolean.TRUE.equals(recipe.getIsPublic())) {
            authorizationHelper.requireFamilyMember(currentUser.getId(), recipe.getFamilyId());
        }
        reactionRepository.deleteForUser(recipeId, currentUser.getId());
        return new MessageResponse("Reaction removed");
    }

    public ReactionCounts getCounts(UUID recipeId, CustomUserDetails currentUser) {
        var recipe = recipeRepository.findById(recipeId)
            .orElseThrow(() -> new ResourceNotFoundException("Recipe not found: " + recipeId));
        if (!Boolean.TRUE.equals(recipe.getIsPublic())) {
            authorizationHelper.requireFamilyMember(currentUser.getId(), recipe.getFamilyId());
        }
        return buildCounts(recipeId, /*withUsers*/ true);
    }

    private ReactionCounts buildCounts(UUID recipeId, boolean withUsers) {
        long like = 0, love = 0, yum = 0, wantToTry = 0;
        for (var c : reactionRepository.counts(recipeId)) {
            switch (c.type()) {
                case LIKE       -> like = c.count();
                case LOVE       -> love = c.count();
                case YUM        -> yum = c.count();
                case WANT_TO_TRY -> wantToTry = c.count();
            }
        }
        List<ReactionCounts.UserReaction> users = withUsers
            ? reactionRepository.listForRecipe(recipeId).stream()
                .map(r -> ReactionCounts.UserReaction.builder()
                    .userId(r.userId())
                    .fullName(r.fullName())
                    .avatarUrl(r.avatarUrl())
                    .reactionType(r.reactionType().name())
                    .build())
                .toList()
            : new ArrayList<>();
        return ReactionCounts.builder()
            .like(like)
            .love(love)
            .yum(yum)
            .wantToTry(wantToTry)
            .users(users)
            .build();
    }
}