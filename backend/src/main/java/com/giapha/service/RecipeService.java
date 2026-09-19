package com.giapha.service;

import com.giapha.exception.BadRequestException;
import com.giapha.exception.ForbiddenException;
import com.giapha.exception.ResourceNotFoundException;
import com.giapha.model.dto.common.UserSummary;
import com.giapha.model.dto.comment.CommentDto;
import com.giapha.model.dto.comment.CommentThread;
import com.giapha.model.dto.origin.OriginDto;
import com.giapha.model.dto.recipe.CreateRecipeRequest;
import com.giapha.model.dto.recipe.IngredientDto;
import com.giapha.model.dto.recipe.PaginatedRecipes;
import com.giapha.model.dto.recipe.RecipeDetailDto;
import com.giapha.model.dto.recipe.RecipeDto;
import com.giapha.model.dto.recipe.RecipeWithStats;
import com.giapha.model.dto.recipe.StepDto;
import com.giapha.model.dto.recipe.UpdateRecipeRequest;
import com.giapha.model.entity.Recipe;
import com.giapha.model.entity.RecipeOrigin;
import com.giapha.repository.RecipeCommentRepository;
import com.giapha.repository.RecipeIngredientRepository;
import com.giapha.repository.RecipeOriginRepository;
import com.giapha.repository.RecipeReactionRepository;
import com.giapha.repository.RecipeRepository;
import com.giapha.repository.RecipeStepRepository;
import com.giapha.repository.UserRepository;
import com.giapha.security.CustomUserDetails;
import com.giapha.util.AuthorizationHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Orchestrates recipe CRUD plus the aggregate detail view (ingredients, steps,
 * origins, comments, reactions). Heavy work is delegated to the repositories;
 * this class is responsible for authorization and assembling DTOs.
 */
@Service
public class RecipeService {

    private final RecipeRepository recipeRepository;
    private final RecipeIngredientRepository ingredientRepository;
    private final RecipeStepRepository stepRepository;
    private final RecipeOriginRepository originRepository;
    private final RecipeReactionRepository reactionRepository;
    private final RecipeCommentRepository commentRepository;
    private final UserRepository userRepository;
    private final AuthorizationHelper authorizationHelper;

    public RecipeService(RecipeRepository recipeRepository,
                         RecipeIngredientRepository ingredientRepository,
                         RecipeStepRepository stepRepository,
                         RecipeOriginRepository originRepository,
                         RecipeReactionRepository reactionRepository,
                         RecipeCommentRepository commentRepository,
                         UserRepository userRepository,
                         AuthorizationHelper authorizationHelper) {
        this.recipeRepository = recipeRepository;
        this.ingredientRepository = ingredientRepository;
        this.stepRepository = stepRepository;
        this.originRepository = originRepository;
        this.reactionRepository = reactionRepository;
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
        this.authorizationHelper = authorizationHelper;
    }

    // ------------------------------------------------------------------ //
    // A. Recipe CRUD
    // ------------------------------------------------------------------ //

    public PaginatedRecipes listForFamily(UUID familyId, String cuisine, String difficulty,
                                          String search, UUID authorId, Integer page, Integer size,
                                          CustomUserDetails currentUser) {
        authorizationHelper.requireFamilyMember(currentUser.getId(), familyId);
        int p = page == null || page < 0 ? 0 : page;
        int s = size == null || size <= 0 ? 20 : Math.min(size, 100);
        int offset = p * s;

        List<RecipeWithStats> rows = recipeRepository.listForFamily(
            familyId, cuisine, difficulty, search, authorId, s, offset);
        int total = recipeRepository.countForFamily(
            familyId, cuisine, difficulty, search, authorId);

        return PaginatedRecipes.builder()
            .recipes(rows)
            .total(total)
            .page(p)
            .size(s)
            .build();
    }

    @Transactional
    public RecipeDetailDto createRecipe(UUID familyId, CreateRecipeRequest req,
                                        CustomUserDetails currentUser) {
        authorizationHelper.requireFamilyMember(currentUser.getId(), familyId);

        // 1) Insert the recipe row
        Recipe recipe = Recipe.builder()
            .familyId(familyId)
            .authorId(currentUser.getId())
            .title(req.getTitle())
            .description(req.getDescription())
            .story(req.getStory())
            .cuisineType(req.getCuisineType())
            .difficulty(req.getDifficulty())
            .prepTimeMinutes(req.getPrepTimeMinutes())
            .cookTimeMinutes(req.getCookTimeMinutes())
            .servings(req.getServings())
            .instructions(req.getInstructions())
            .imageUrl(req.getImageUrl())
            .isPublic(req.getIsPublic())
            .build();
        UUID recipeId = recipeRepository.insert(recipe);

        // 2) Sub-collections (replace-only on create; nothing to delete)
        persistIngredients(recipeId, req.getIngredients(), false);
        persistSteps(recipeId, req.getSteps(), false);
        persistOrigins(recipeId, familyId, req.getOrigins(), false);

        return buildDetail(recipeId, currentUser);
    }

    public RecipeDetailDto getRecipe(UUID recipeId, CustomUserDetails currentUser) {
        Recipe recipe = recipeRepository.findById(recipeId)
            .orElseThrow(() -> new ResourceNotFoundException("Recipe not found: " + recipeId));

        // Viewers must be family members OR the recipe must be public
        if (!Boolean.TRUE.equals(recipe.getIsPublic())) {
            authorizationHelper.requireFamilyMember(currentUser.getId(), recipe.getFamilyId());
        }

        // Increment view count (intentionally outside the read transaction to
        // keep the response fast and not roll back the read on contention).
        recipeRepository.incrementViewCount(recipeId);
        return buildDetail(recipeId, currentUser);
    }

    @Transactional
    public RecipeDetailDto updateRecipe(UUID recipeId, UpdateRecipeRequest req,
                                        CustomUserDetails currentUser) {
        Recipe existing = recipeRepository.findById(recipeId)
            .orElseThrow(() -> new ResourceNotFoundException("Recipe not found: " + recipeId));

        boolean isAuthor = existing.getAuthorId().equals(currentUser.getId());
        boolean isFamilyAdmin = authorizationHelper.isFamilyAdmin(currentUser.getId(), existing.getFamilyId());
        if (!isAuthor && !isFamilyAdmin) {
            throw new ForbiddenException("Chỉ tác giả hoặc quản trị viên mới có thể sửa công thức");
        }

        recipeRepository.update(
            recipeId,
            req.getTitle(),
            req.getDescription(),
            req.getStory(),
            req.getCuisineType(),
            req.getDifficulty() == null ? null : req.getDifficulty().name(),
            req.getPrepTimeMinutes(),
            req.getCookTimeMinutes(),
            req.getServings(),
            req.getInstructions(),
            req.getImageUrl(),
            req.getIsPublic()
        );

        // Sub-collections are full-replace when provided (null = leave alone).
        if (req.getIngredients() != null) {
            persistIngredients(recipeId, req.getIngredients(), true);
        }
        if (req.getSteps() != null) {
            persistSteps(recipeId, req.getSteps(), true);
        }
        if (req.getOrigins() != null) {
            persistOrigins(recipeId, existing.getFamilyId(), req.getOrigins(), true);
        }

        return buildDetail(recipeId, currentUser);
    }

    public void deleteRecipe(UUID recipeId, CustomUserDetails currentUser) {
        Recipe existing = recipeRepository.findById(recipeId)
            .orElseThrow(() -> new ResourceNotFoundException("Recipe not found: " + recipeId));

        boolean isAuthor = existing.getAuthorId().equals(currentUser.getId());
        boolean isFamilyAdmin = authorizationHelper.isFamilyAdmin(currentUser.getId(), existing.getFamilyId());
        if (!isAuthor && !isFamilyAdmin) {
            throw new ForbiddenException("Chỉ tác giả hoặc quản trị viên mới có thể xóa công thức");
        }
        // ON DELETE CASCADE handles ingredients/steps/origins/reactions/comments.
        recipeRepository.delete(recipeId);
    }

    // ------------------------------------------------------------------ //
    // F. Public recipe search
    // ------------------------------------------------------------------ //

    public PaginatedRecipes searchPublic(String cuisine, String difficulty, String search,
                                         String sort, Integer page, Integer size) {
        int p = page == null || page < 0 ? 0 : page;
        int s = size == null || size <= 0 ? 20 : Math.min(size, 100);
        int offset = p * s;
        List<RecipeWithStats> rows = recipeRepository.searchPublic(
            cuisine, difficulty, search, sort, s, offset);
        int total = recipeRepository.countPublic(cuisine, difficulty, search);
        return PaginatedRecipes.builder()
            .recipes(rows)
            .total(total)
            .page(p)
            .size(s)
            .build();
    }

    // ------------------------------------------------------------------ //
    // Helpers
    // ------------------------------------------------------------------ //

    private void persistIngredients(UUID recipeId, List<IngredientDto> items, boolean replace) {
        if (items == null) return;
        if (replace) ingredientRepository.deleteByRecipe(recipeId);
        int order = 0;
        for (IngredientDto i : items) {
            ingredientRepository.insert(com.giapha.model.entity.RecipeIngredient.builder()
                .recipeId(recipeId)
                .name(i.getName())
                .quantity(i.getQuantity())
                .unit(i.getUnit())
                .notes(i.getNotes())
                .orderIndex(i.getOrderIndex() != null ? i.getOrderIndex() : order)
                .build());
            order++;
        }
    }

    private void persistSteps(UUID recipeId, List<StepDto> steps, boolean replace) {
        if (steps == null) return;
        if (replace) stepRepository.deleteByRecipe(recipeId);
        for (StepDto s : steps) {
            if (s.getStepNumber() == null || s.getStepNumber() <= 0) {
                throw new BadRequestException("stepNumber must be positive");
            }
            stepRepository.insert(com.giapha.model.entity.RecipeStep.builder()
                .recipeId(recipeId)
                .stepNumber(s.getStepNumber())
                .instruction(s.getInstruction())
                .durationMinutes(s.getDurationMinutes())
                .imageUrl(s.getImageUrl())
                .build());
        }
    }

    private void persistOrigins(UUID recipeId, UUID familyId,
                                List<com.giapha.model.dto.origin.CreateOriginRequest> origins,
                                boolean replace) {
        if (origins == null) return;
        if (replace) originRepository.deleteByRecipe(recipeId);
        for (var o : origins) {
            if (o.getFromMemberId().equals(o.getToMemberId())) {
                throw new BadRequestException("fromMemberId and toMemberId must differ");
            }
            if (!originRepository.bothMembersInFamily(o.getFromMemberId(), o.getToMemberId(), familyId)) {
                throw new BadRequestException("Both members must belong to the recipe's family");
            }
            originRepository.insert(RecipeOrigin.builder()
                .recipeId(recipeId)
                .fromMemberId(o.getFromMemberId())
                .toMemberId(o.getToMemberId())
                .yearTransmitted(o.getYearTransmitted())
                .generationGap(o.getGenerationGap())
                .story(o.getStory())
                .build());
        }
    }

    /**
     * Single entry point that joins every table the detail page needs.
     * The repository methods remain small and SQL-focused; this method
     * handles the glue.
     */
    private RecipeDetailDto buildDetail(UUID recipeId, CustomUserDetails currentUser) {
        RecipeDto recipe = recipeRepository.findDtoById(recipeId)
            .orElseThrow(() -> new ResourceNotFoundException("Recipe not found: " + recipeId));

        UserSummary author = userRepository.findById(recipe.getAuthorId())
            .map(u -> new UserSummary(u.getId(), u.getFullName(), u.getEmail(), u.getAvatarUrl()))
            .orElse(null);

        List<IngredientDto> ingredients = ingredientRepository.findDtosByRecipe(recipeId);
        List<StepDto> steps = stepRepository.findDtosByRecipe(recipeId);
        List<OriginDto> origins = originRepository.findDtosByRecipe(recipeId);
        List<CommentThread> threads = buildCommentThreads(recipeId);

        Map<String, Integer> reactions = new LinkedHashMap<>();
        reactions.put("like", 0);
        reactions.put("love", 0);
        reactions.put("yum", 0);
        reactions.put("want_to_try", 0);
        for (var c : reactionRepository.counts(recipeId)) {
            reactions.put(c.type().name().toLowerCase(), (int) c.count());
        }

        String userReaction = reactionRepository.findUserReaction(recipeId, currentUser.getId())
            .map(r -> r.getReactionType().name())
            .orElse(null);

        return RecipeDetailDto.builder()
            .recipe(recipe)
            .author(author)
            .ingredients(ingredients)
            .steps(steps)
            .origins(origins)
            .comments(threads)
            .reactions(reactions)
            .userReaction(userReaction)
            .build();
    }

    /**
     * Build the threaded view: fetch every comment, then walk the parent/child
     * links in two passes (top-level first, then attach children by parent id).
     */
    List<CommentThread> buildCommentThreads(UUID recipeId) {
        var rows = commentRepository.findByRecipe(recipeId);
        if (rows.isEmpty()) return List.of();

        // Resolve authors in one batch
        var authorIds = rows.stream().map(com.giapha.model.entity.RecipeComment::getUserId).distinct().toList();
        Map<UUID, UserSummary> authorsById = new HashMap<>();
        for (var us : userRepository.findSummariesByIds(authorIds)) {
            authorsById.put(us.id(),
                new UserSummary(us.id(), us.fullName(), us.email(), us.avatarUrl()));
        }

        // First pass: convert to DTOs and create empty thread containers
        Map<UUID, CommentDto> dtos = new HashMap<>();
        Map<UUID, List<CommentThread>> childrenByParent = new HashMap<>();
        List<CommentDto> roots = new ArrayList<>();

        for (var c : rows) {
            CommentDto dto = CommentDto.builder()
                .id(c.getId())
                .recipeId(c.getRecipeId())
                .userId(c.getUserId())
                .parentCommentId(c.getParentCommentId())
                .content(c.getContent())
                .createdAt(c.getCreatedAt())
                .updatedAt(c.getUpdatedAt())
                .user(authorsById.get(c.getUserId()))
                .build();
            dtos.put(c.getId(), dto);
            if (c.getParentCommentId() == null) {
                roots.add(dto);
            } else {
                childrenByParent.computeIfAbsent(c.getParentCommentId(), k -> new ArrayList<>()).add(null);
            }
        }

        // Second pass: bucket children by parent id (preserving chronological order)
        childrenByParent.clear();
        for (var c : rows) {
            if (c.getParentCommentId() != null) {
                childrenByParent.computeIfAbsent(c.getParentCommentId(), k -> new ArrayList<>())
                    .add(CommentThread.builder().comment(dtos.get(c.getId())).replies(new ArrayList<>()).build());
            }
        }

        // Build top-level threads
        List<CommentThread> result = new ArrayList<>();
        roots.sort(Comparator.comparing(CommentDto::getCreatedAt));
        for (CommentDto r : roots) {
            result.add(CommentThread.builder()
                .comment(r)
                .replies(childrenByParent.getOrDefault(r.getId(), List.of()))
                .build());
        }
        return result;
    }
}