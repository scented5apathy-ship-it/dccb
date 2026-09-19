package com.giapha.model.dto.recipe;

import com.giapha.model.entity.Difficulty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecipeDto {
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