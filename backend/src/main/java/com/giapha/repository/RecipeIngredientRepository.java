package com.giapha.repository;

import com.giapha.model.dto.recipe.IngredientDto;
import com.giapha.model.entity.RecipeIngredient;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public class RecipeIngredientRepository {

    private final JdbcTemplate jdbc;

    public RecipeIngredientRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private static final RowMapper<RecipeIngredient> ROW_MAPPER = (rs, n) -> RecipeIngredient.builder()
        .id((UUID) rs.getObject("id"))
        .recipeId((UUID) rs.getObject("recipe_id"))
        .name(rs.getString("name"))
        .quantity(rs.getBigDecimal("quantity"))
        .unit(rs.getString("unit"))
        .notes(rs.getString("notes"))
        .orderIndex(rs.getInt("order_index"))
        .build();

    private static final RowMapper<IngredientDto> DTO_MAPPER = (rs, n) -> IngredientDto.builder()
        .name(rs.getString("name"))
        .quantity(rs.getBigDecimal("quantity"))
        .unit(rs.getString("unit"))
        .notes(rs.getString("notes"))
        .orderIndex(rs.getInt("order_index"))
        .build();

    public UUID insert(RecipeIngredient ing) {
        UUID id = ing.getId() != null ? ing.getId() : UUID.randomUUID();
        jdbc.update(
            "INSERT INTO caygiaphaso.recipe_ingredients " +
            "(id, recipe_id, name, quantity, unit, notes, order_index) " +
            "VALUES (?, ?, ?, ?, ?, ?, ?)",
            id, ing.getRecipeId(), ing.getName(), ing.getQuantity(),
            ing.getUnit(), ing.getNotes(), ing.getOrderIndex()
        );
        return id;
    }

    public void replaceAll(UUID recipeId, List<IngredientDto> items) {
        jdbc.update("DELETE FROM caygiaphaso.recipe_ingredients WHERE recipe_id = ?", recipeId);
        if (items == null) return;
        int order = 0;
        for (IngredientDto i : items) {
            jdbc.update(
                "INSERT INTO caygiaphaso.recipe_ingredients " +
                "(id, recipe_id, name, quantity, unit, notes, order_index) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?)",
                UUID.randomUUID(), recipeId, i.getName(), i.getQuantity(),
                i.getUnit(), i.getNotes(), i.getOrderIndex() != null ? i.getOrderIndex() : order
            );
            order++;
        }
    }

    public List<RecipeIngredient> findByRecipe(UUID recipeId) {
        return jdbc.query(
            "SELECT * FROM caygiaphaso.recipe_ingredients WHERE recipe_id = ? ORDER BY order_index",
            ROW_MAPPER, recipeId);
    }

    public List<IngredientDto> findDtosByRecipe(UUID recipeId) {
        return jdbc.query(
            "SELECT name, quantity, unit, notes, order_index " +
            "FROM caygiaphaso.recipe_ingredients WHERE recipe_id = ? ORDER BY order_index",
            DTO_MAPPER, recipeId);
    }

    public void deleteByRecipe(UUID recipeId) {
        jdbc.update("DELETE FROM caygiaphaso.recipe_ingredients WHERE recipe_id = ?", recipeId);
    }
}