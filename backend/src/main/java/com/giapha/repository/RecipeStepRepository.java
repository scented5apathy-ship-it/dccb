package com.giapha.repository;

import com.giapha.model.dto.recipe.StepDto;
import com.giapha.model.entity.RecipeStep;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public class RecipeStepRepository {

    private final JdbcTemplate jdbc;

    public RecipeStepRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private static final RowMapper<RecipeStep> ROW_MAPPER = (rs, n) -> RecipeStep.builder()
        .id((UUID) rs.getObject("id"))
        .recipeId((UUID) rs.getObject("recipe_id"))
        .stepNumber(rs.getInt("step_number"))
        .instruction(rs.getString("instruction"))
        .durationMinutes((Integer) rs.getObject("duration_minutes"))
        .imageUrl(rs.getString("image_url"))
        .build();

    private static final RowMapper<StepDto> DTO_MAPPER = (rs, n) -> StepDto.builder()
        .stepNumber(rs.getInt("step_number"))
        .instruction(rs.getString("instruction"))
        .durationMinutes((Integer) rs.getObject("duration_minutes"))
        .imageUrl(rs.getString("image_url"))
        .build();

    public UUID insert(RecipeStep step) {
        UUID id = step.getId() != null ? step.getId() : UUID.randomUUID();
        jdbc.update(
            "INSERT INTO caygiaphaso.recipe_steps " +
            "(id, recipe_id, step_number, instruction, duration_minutes, image_url) " +
            "VALUES (?, ?, ?, ?, ?, ?)",
            id, step.getRecipeId(), step.getStepNumber(), step.getInstruction(),
            step.getDurationMinutes(), step.getImageUrl()
        );
        return id;
    }

    public void replaceAll(UUID recipeId, List<StepDto> steps) {
        jdbc.update("DELETE FROM caygiaphaso.recipe_steps WHERE recipe_id = ?", recipeId);
        if (steps == null) return;
        for (StepDto s : steps) {
            jdbc.update(
                "INSERT INTO caygiaphaso.recipe_steps " +
                "(id, recipe_id, step_number, instruction, duration_minutes, image_url) " +
                "VALUES (?, ?, ?, ?, ?, ?)",
                UUID.randomUUID(), recipeId, s.getStepNumber(), s.getInstruction(),
                s.getDurationMinutes(), s.getImageUrl()
            );
        }
    }

    public List<RecipeStep> findByRecipe(UUID recipeId) {
        return jdbc.query(
            "SELECT * FROM caygiaphaso.recipe_steps WHERE recipe_id = ? ORDER BY step_number",
            ROW_MAPPER, recipeId);
    }

    public List<StepDto> findDtosByRecipe(UUID recipeId) {
        return jdbc.query(
            "SELECT step_number, instruction, duration_minutes, image_url " +
            "FROM caygiaphaso.recipe_steps WHERE recipe_id = ? ORDER BY step_number",
            DTO_MAPPER, recipeId);
    }

    public void deleteByRecipe(UUID recipeId) {
        jdbc.update("DELETE FROM caygiaphaso.recipe_steps WHERE recipe_id = ?", recipeId);
    }
}