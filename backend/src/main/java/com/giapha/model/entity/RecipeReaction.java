package com.giapha.model.entity;

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
public class RecipeReaction {
    private UUID id;
    private UUID recipeId;
    private UUID userId;
    private ReactionType reactionType;
    private OffsetDateTime createdAt;
}