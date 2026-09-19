package com.giapha.controller;

import com.giapha.model.dto.common.MessageResponse;
import com.giapha.model.dto.reaction.ReactionCounts;
import com.giapha.model.dto.reaction.ReactionRequest;
import com.giapha.security.CustomUserDetails;
import com.giapha.service.RecipeReactionService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Recipe reaction endpoints: toggle (upsert), remove, and list counts + users.
 * The Spring Boot app is mounted at context-path=/api, so the class-level
 * mapping starts at root.
 */
@RestController
@RequestMapping("/recipes/{recipeId}/reactions")
public class RecipeReactionController {

    private final RecipeReactionService reactionService;

    public RecipeReactionController(RecipeReactionService reactionService) {
        this.reactionService = reactionService;
    }

    // C9
    @PostMapping
    public ReactionCounts react(
            @PathVariable UUID recipeId,
            @Valid @RequestBody ReactionRequest req,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        return reactionService.addOrUpdate(recipeId, req.getReactionType(), currentUser);
    }

    // C10
    @DeleteMapping
    public MessageResponse remove(
            @PathVariable UUID recipeId,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        return reactionService.remove(recipeId, currentUser);
    }

    // C11
    @GetMapping
    public ReactionCounts list(
            @PathVariable UUID recipeId,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        return reactionService.getCounts(recipeId, currentUser);
    }
}