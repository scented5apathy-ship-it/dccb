package com.giapha.controller;

import com.giapha.model.dto.comment.CommentDto;
import com.giapha.model.dto.comment.CommentThread;
import com.giapha.model.dto.comment.CreateCommentRequest;
import com.giapha.model.dto.comment.UpdateCommentRequest;
import com.giapha.model.dto.common.MessageResponse;
import com.giapha.security.CustomUserDetails;
import com.giapha.service.RecipeCommentService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * Recipe comment endpoints split between the recipe-scoped (add + list) and
 * the comment-id-scoped (update + delete) routes. The Spring Boot app is
 * mounted at context-path=/api, so class-level mapping starts at root.
 */
@RestController
@RequestMapping("")
public class RecipeCommentController {

    private final RecipeCommentService commentService;

    public RecipeCommentController(RecipeCommentService commentService) {
        this.commentService = commentService;
    }

    // D12
    @PostMapping("/recipes/{recipeId}/comments")
    public CommentDto add(
            @PathVariable UUID recipeId,
            @Valid @RequestBody CreateCommentRequest req,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        return commentService.addComment(recipeId, req.getContent(), req.getParentCommentId(), currentUser);
    }

    // D13
    @GetMapping("/recipes/{recipeId}/comments")
    public List<CommentThread> list(
            @PathVariable UUID recipeId,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        return commentService.listComments(recipeId, currentUser);
    }

    // D14
    @PutMapping("/comments/{commentId}")
    public CommentDto update(
            @PathVariable UUID commentId,
            @Valid @RequestBody UpdateCommentRequest req,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        return commentService.updateComment(commentId, req.getContent(), currentUser);
    }

    // D15
    @DeleteMapping("/comments/{commentId}")
    public MessageResponse delete(
            @PathVariable UUID commentId,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        return commentService.deleteComment(commentId, currentUser);
    }
}