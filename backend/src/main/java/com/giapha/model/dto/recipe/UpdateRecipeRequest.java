package com.giapha.model.dto.recipe;

import com.giapha.model.dto.origin.CreateOriginRequest;
import com.giapha.model.entity.Difficulty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Patch payload - any field may be null meaning "leave unchanged".
 * Nested collections (ingredients/steps/origins) when present REPLACE
 * the existing rows for the recipe.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateRecipeRequest {
    private String title;
    private String description;
    private String story;
    private String cuisineType;
    private Difficulty difficulty;
    private Integer prepTimeMinutes;
    private Integer cookTimeMinutes;
    private Integer servings;
    private String instructions;
    private String imageUrl;
    private Boolean isPublic;

    private List<IngredientDto> ingredients;
    private List<StepDto> steps;
    private List<CreateOriginRequest> origins;
}