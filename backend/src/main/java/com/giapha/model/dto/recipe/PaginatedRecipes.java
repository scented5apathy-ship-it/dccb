package com.giapha.model.dto.recipe;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaginatedRecipes {
    private List<RecipeWithStats> recipes;
    private long total;
    private int page;
    private int size;
}