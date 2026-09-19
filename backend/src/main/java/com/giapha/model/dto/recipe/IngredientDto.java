package com.giapha.model.dto.recipe;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IngredientDto {
    private String name;
    private BigDecimal quantity;
    private String unit;
    private String notes;
    private Integer orderIndex;
}