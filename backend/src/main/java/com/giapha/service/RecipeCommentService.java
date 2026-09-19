package com.giapha.service;

import com.giapha.exception.BadRequestException;
import com.giapha.exception.ForbiddenException;
import com.giapha.exception.ResourceNotFoundException;
import com.giapha.model.dto.comment.CommentDto;
import com.giapha.model.dto.comment.CommentThread;
import com.giapha.model.dto.common.MessageResponse;
import com.giapha.model.entity.Recipe;
import com.giapha.model.entity.RecipeComment;
import com.giapha.repository.RecipeCommentRepository;
import com.giapha.repository.RecipeRepository;
import com.giapha.repository.UserRepository;
import com.giapha.security.CustomUserDetails;
import com.giapha.util.AuthorizationHelper;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Threaded comment handling for recipes. Authorization mirrors the recipe
 * visibility rules: anyone on a public recipe can comment, family members
 * only on private ones. Editing/deleting requires ownership or family admin.
 */
@Service
public class RecipeCommentService {

    private final RecipeCommentRepository commentRepository;
    private final RecipeRepository recipeRepository;
    private final UserRepository userRepository;
    private final AuthorizationHelper authorizationHelper;

    public RecipeCommentService(RecipeCommentRepository commentRepository,
                                RecipeRepository recipeRepository,
                                UserRepository userRepository,
                                AuthorizationHelper authorizationHelper) {
        this.commentRepository = commentRepository;
        this.recipeRepository = recipeRepository;
        this.userRepository = userRepository;
        this.authorizationHelper = authorizationHelper;
    }

    public CommentDto addComment(UUID recipeId, String content, UUID parentCommentId,
                                 CustomUserDetails currentUser) {
        Recipe recipe = recipeRepository.findById(recipeId)
            .orElseThrow(() -> new ResourceNotFoundException("Recipe not found: " + recipeId));
        if (!Boolean.TRUE.equals(recipe.getIsPublic())) {
            authorizationHelper.requireFamilyMember(currentUser.getId(), recipe.getFamilyId());
        }

        // Validate parent comment (if any) belongs to the same recipe
        if (parentCommentId != null) {
            RecipeComment parent = commentRepository.findById(parentCommentId)
                .orElseThrow(() -> new ResourceNotFoundException("Parent comment not found: " + parentCommentId));
            if (!parent.getRecipeId().equals(recipeId)) {
                throw new BadRequestException("Parent comment belongs to a different recipe");
            }
        }

        UUID id = commentRepository.insert(RecipeComment.builder()
            .recipeId(recipeId)
            .userId(currentUser.getId())
            .content(content)
            .parentCommentId(parentCommentId)
            .build());

        RecipeComment saved = commentRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Comment not found after insert: " + id));
        return toDto(saved);
    }

    public List<CommentThread> listComments(UUID recipeId, CustomUserDetails currentUser) {
        Recipe recipe = recipeRepository.findById(recipeId)
            .orElseThrow(() -> new ResourceNotFoundException("Recipe not found: " + recipeId));
        if (!Boolean.TRUE.equals(recipe.getIsPublic())) {
            authorizationHelper.requireFamilyMember(currentUser.getId(), recipe.getFamilyId());
        }
        return buildThreads(recipeId);
    }

    public CommentDto updateComment(UUID commentId, String content, CustomUserDetails currentUser) {
        RecipeComment existing = commentRepository.findById(commentId)
            .orElseThrow(() -> new ResourceNotFoundException("Comment not found: " + commentId));
        if (!existing.getUserId().equals(currentUser.getId())) {
            throw new ForbiddenException("Chỉ tác giả mới có thể sửa bình luận");
        }
        commentRepository.updateContent(commentId, content);
        RecipeComment updated = commentRepository.findById(commentId).orElseThrow();
        return toDto(updated);
    }

    public MessageResponse deleteComment(UUID commentId, CustomUserDetails currentUser) {
        RecipeComment existing = commentRepository.findById(commentId)
            .orElseThrow(() -> new ResourceNotFoundException("Comment not found: " + commentId));
        Recipe recipe = recipeRepository.findById(existing.getRecipeId())
            .orElseThrow(() -> new ResourceNotFoundException("Recipe not found: " + existing.getRecipeId()));

        boolean isOwner = existing.getUserId().equals(currentUser.getId());
        boolean isAdmin = authorizationHelper.isFamilyAdmin(currentUser.getId(), recipe.getFamilyId());
        if (!isOwner && !isAdmin) {
            throw new ForbiddenException("Chỉ tác giả hoặc quản trị viên mới có thể xóa bình luận");
        }
        commentRepository.softDelete(commentId);
        return new MessageResponse("Comment deleted");
    }

    // ------------------------------------------------------------------ //
    // Helpers
    // ------------------------------------------------------------------ //

    private CommentDto toDto(RecipeComment c) {
        return CommentDto.builder()
            .id(c.getId())
            .recipeId(c.getRecipeId())
            .userId(c.getUserId())
            .parentCommentId(c.getParentCommentId())
            .content(c.getContent())
            .createdAt(c.getCreatedAt())
            .updatedAt(c.getUpdatedAt())
            .user(userRepository.findById(c.getUserId())
                .map(u -> new com.giapha.model.dto.common.UserSummary(
                    u.getId(), u.getFullName(), u.getEmail(), u.getAvatarUrl()))
                .orElse(null))
            .build();
    }

    /**
     * Build a recursive thread from the flat list of comments. Children are
     * attached to their parent by parentCommentId; top-level comments have a
     * null parent.
     */
    List<CommentThread> buildThreads(UUID recipeId) {
        var rows = commentRepository.findByRecipe(recipeId);
        if (rows.isEmpty()) return List.of();

        var authorIds = rows.stream().map(RecipeComment::getUserId).distinct().toList();
        Map<UUID, com.giapha.model.dto.common.UserSummary> authorsById = new HashMap<>();
        for (var u : userRepository.findSummariesByIds(authorIds)) {
            authorsById.put(u.id(),
                new com.giapha.model.dto.common.UserSummary(u.id(), u.fullName(), u.email(), u.avatarUrl()));
        }

        Map<UUID, List<CommentThread>> childrenByParent = new HashMap<>();
        List<CommentThread> roots = new ArrayList<>();

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
            CommentThread thread = CommentThread.builder()
                .comment(dto)
                .replies(new ArrayList<>())
                .build();

            if (c.getParentCommentId() == null) {
                roots.add(thread);
            } else {
                childrenByParent.computeIfAbsent(c.getParentCommentId(), k -> new ArrayList<>()).add(thread);
            }
        }

        // Recursive fill
        for (var t : roots) {
            attachChildren(t, childrenByParent);
        }
        return roots;
    }

    private void attachChildren(CommentThread parent,
                                Map<UUID, List<CommentThread>> childrenByParent) {
        List<CommentThread> kids = childrenByParent.get(parent.getComment().getId());
        if (kids == null || kids.isEmpty()) return;
        parent.getReplies().addAll(kids);
        for (var k : kids) {
            attachChildren(k, childrenByParent);
        }
    }
}