package com.giapha.model.dto.recipe;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Optional filters and pagination applied to the family recipe list.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecipeSearchRequest {
    private String cuisine;
    private String difficulty;
    private String search;
    private String authorId;
    private Integer page;
    private Integer size;
}