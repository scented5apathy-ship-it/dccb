package com.giapha.model.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * A single edge in the recipe's genealogy: who transmitted the recipe to whom,
 * when, and what story accompanied the transmission.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecipeOrigin {
    private UUID id;
    private UUID recipeId;
    private UUID fromMemberId;
    private UUID toMemberId;
    private Integer yearTransmitted;
    private Integer generationGap;
    private String story;
    private OffsetDateTime createdAt;
}