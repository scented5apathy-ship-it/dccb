package com.giapha.model.dto.recipe;

import com.giapha.model.dto.comment.CommentThread;
import com.giapha.model.dto.common.UserSummary;
import com.giapha.model.dto.origin.OriginDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Single-recipe detail payload: recipe body + author + structured sub-trees.
 * Comments and reactions are eagerly resolved so the client can render the
 * detail page in one request.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecipeDetailDto {
    private RecipeDto recipe;
    private UserSummary author;
    private List<IngredientDto> ingredients;
    private List<StepDto> steps;
    private List<OriginDto> origins;
    private List<CommentThread> comments;

    /** { like, love, yum, want_to_try } reaction counts. */
    private Map<String, Integer> reactions;

    /** The current user's reaction, if any (null = no reaction). */
    private String userReaction;
}