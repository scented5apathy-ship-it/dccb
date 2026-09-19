package com.giapha.model.dto.recipe;

import com.giapha.model.dto.common.UserSummary;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Recipe row enriched with author + aggregate counts - the shape returned
 * by the family recipe list and the public search endpoint.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecipeWithStats {
    private RecipeDto recipe;
    private UserSummary author;

    /** { like, love, yum, want_to_try } counts plus total reactions. */
    private Map<String, Integer> reactions;

    private Integer comments;
    private Integer origins;
    private Integer viewCount;
}