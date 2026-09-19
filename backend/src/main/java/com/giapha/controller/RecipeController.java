package com.giapha.controller;

import com.giapha.model.dto.common.MessageResponse;
import com.giapha.model.dto.recipe.CreateRecipeRequest;
import com.giapha.model.dto.recipe.PaginatedRecipes;
import com.giapha.model.dto.recipe.RecipeDetailDto;
import com.giapha.model.dto.recipe.UpdateRecipeRequest;
import com.giapha.security.CustomUserDetails;
import com.giapha.service.RecipeService;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Family-scoped recipe endpoints (list/create) and global recipe endpoints
 * (read/update/delete) plus the public recipe search. The Spring Boot app is
 * mounted at context-path=/api, so class-level mapping starts at root.
 */
@RestController
@RequestMapping("")
public class RecipeController {

    private final RecipeService recipeService;

    public RecipeController(RecipeService recipeService) {
        this.recipeService = recipeService;
    }

    // A1
    @GetMapping("/families/{familyId}/recipes")
    public PaginatedRecipes listFamilyRecipes(
            @PathVariable UUID familyId,
            @RequestParam(required = false) String cuisine,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID authorId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        return recipeService.listForFamily(familyId, cuisine, difficulty, search, authorId, page, size, currentUser);
    }

    // A2
    @PostMapping("/families/{familyId}/recipes")
    public RecipeDetailDto createRecipe(
            @PathVariable UUID familyId,
            @Valid @RequestBody CreateRecipeRequest req,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        return recipeService.createRecipe(familyId, req, currentUser);
    }

    // A3
    @GetMapping("/recipes/{recipeId}")
    public RecipeDetailDto getRecipe(
            @PathVariable UUID recipeId,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        return recipeService.getRecipe(recipeId, currentUser);
    }

    // A4
    @PutMapping("/recipes/{recipeId}")
    public RecipeDetailDto updateRecipe(
            @PathVariable UUID recipeId,
            @RequestBody UpdateRecipeRequest req,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        return recipeService.updateRecipe(recipeId, req, currentUser);
    }

    // A5
    @DeleteMapping("/recipes/{recipeId}")
    public MessageResponse deleteRecipe(
            @PathVariable UUID recipeId,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        recipeService.deleteRecipe(recipeId, currentUser);
        return new MessageResponse("Recipe deleted");
    }

    // E - public search
    @GetMapping("/recipes/public")
    public PaginatedRecipes searchPublic(
            @RequestParam(required = false) String cuisine,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "recent") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return recipeService.searchPublic(cuisine, difficulty, search, sort, page, size);
    }
}