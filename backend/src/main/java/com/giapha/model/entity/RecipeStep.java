package com.giapha.model.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecipeStep {
    private UUID id;
    private UUID recipeId;
    private Integer stepNumber;
    private String instruction;
    private Integer durationMinutes;
    private String imageUrl;
}