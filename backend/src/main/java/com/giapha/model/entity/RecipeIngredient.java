package com.giapha.model.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecipeIngredient {
    private UUID id;
    private UUID recipeId;
    private String name;
    private BigDecimal quantity;
    private String unit;
    private String notes;
    private Integer orderIndex;
}