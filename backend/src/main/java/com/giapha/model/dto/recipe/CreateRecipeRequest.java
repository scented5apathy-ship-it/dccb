package com.giapha.model.dto.recipe;

import com.giapha.model.dto.origin.CreateOriginRequest;
import com.giapha.model.entity.Difficulty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Single request payload that materializes a recipe with its full set of
 * ingredients, ordered steps, and initial genealogy origins atomically.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateRecipeRequest {

    @NotBlank
    private String title;

    private String description;
    private String story;
    private String cuisineType;
    private Difficulty difficulty;

    private Integer prepTimeMinutes;
    private Integer cookTimeMinutes;
    private Integer servings;

    @NotNull
    @NotBlank
    private String instructions;

    private String imageUrl;
    private Boolean isPublic;

    private List<IngredientDto> ingredients;
    private List<StepDto> steps;
    private List<CreateOriginRequest> origins;
}