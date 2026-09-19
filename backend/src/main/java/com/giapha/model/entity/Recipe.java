package com.giapha.model.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Family-scoped recipe with optional public visibility. Story + imageUrl capture
 * the cultural context that turns a recipe into a family heritage.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Recipe {
    private UUID id;
    private UUID familyId;
    private UUID authorId;
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
    private Integer viewCount;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}