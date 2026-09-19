package com.giapha.repository;

import com.giapha.model.entity.RecipeComment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class RecipeCommentRepository {

    private final JdbcTemplate jdbc;

    public RecipeCommentRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private static final RowMapper<RecipeComment> ROW_MAPPER = (rs, n) -> RecipeComment.builder()
        .id((UUID) rs.getObject("id"))
        .recipeId((UUID) rs.getObject("recipe_id"))
        .userId((UUID) rs.getObject("user_id"))
        .content(rs.getString("content"))
        .parentCommentId((UUID) rs.getObject("parent_comment_id"))
        .createdAt(toOffset(rs.getTimestamp("created_at")))
        .updatedAt(toOffset(rs.getTimestamp("updated_at")))
        .build();

    public UUID insert(RecipeComment c) {
        UUID id = c.getId() != null ? c.getId() : UUID.randomUUID();
        jdbc.update(
            "INSERT INTO caygiaphaso.recipe_comments " +
            "(id, recipe_id, user_id, content, parent_comment_id) " +
            "VALUES (?, ?, ?, ?, ?)",
            id, c.getRecipeId(), c.getUserId(), c.getContent(), c.getParentCommentId()
        );
        return id;
    }

    public Optional<RecipeComment> findById(UUID id) {
        List<RecipeComment> rows = jdbc.query(
            "SELECT * FROM caygiaphaso.recipe_comments WHERE id = ?", ROW_MAPPER, id);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    /**
     * Fetch every comment for a recipe in one shot. The service assembles the
     * tree in Java to keep the query simple.
     */
    public List<RecipeComment> findByRecipe(UUID recipeId) {
        return jdbc.query(
            "SELECT * FROM caygiaphaso.recipe_comments " +
            "WHERE recipe_id = ? ORDER BY created_at",
            ROW_MAPPER, recipeId);
    }

    public void updateContent(UUID id, String content) {
        jdbc.update(
            "UPDATE caygiaphaso.recipe_comments SET content = ? WHERE id = ?",
            content, id);
    }

    public void softDelete(UUID id) {
        jdbc.update(
            "UPDATE caygiaphaso.recipe_comments SET content = '[deleted]' WHERE id = ?",
            id);
    }

    public void deleteByRecipe(UUID recipeId) {
        jdbc.update("DELETE FROM caygiaphaso.recipe_comments WHERE recipe_id = ?", recipeId);
    }

    private static OffsetDateTime toOffset(Timestamp ts) {
        return ts == null ? null : ts.toInstant().atOffset(ZoneOffset.UTC);
    }
}