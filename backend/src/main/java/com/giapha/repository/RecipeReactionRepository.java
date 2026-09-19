package com.giapha.repository;

import com.giapha.model.entity.ReactionType;
import com.giapha.model.entity.RecipeReaction;
import org.springframework.dao.EmptyResultDataAccessException;
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
public class RecipeReactionRepository {

    private final JdbcTemplate jdbc;

    public RecipeReactionRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private static final RowMapper<RecipeReaction> ROW_MAPPER = (rs, n) -> RecipeReaction.builder()
        .id((UUID) rs.getObject("id"))
        .recipeId((UUID) rs.getObject("recipe_id"))
        .userId((UUID) rs.getObject("user_id"))
        .reactionType(ReactionType.valueOf(rs.getString("reaction_type")))
        .createdAt(toOffset(rs.getTimestamp("created_at")))
        .build();

    public UUID upsert(RecipeReaction r) {
        // Remove any prior reaction from the same user on this recipe so that
        // the user only ever has one reaction type active at a time.
        jdbc.update(
            "DELETE FROM caygiaphaso.recipe_reactions WHERE recipe_id = ? AND user_id = ?",
            r.getRecipeId(), r.getUserId()
        );
        UUID id = UUID.randomUUID();
        jdbc.update(
            "INSERT INTO caygiaphaso.recipe_reactions " +
            "(id, recipe_id, user_id, reaction_type) VALUES (?, ?, ?, ?)",
            id, r.getRecipeId(), r.getUserId(), r.getReactionType().name()
        );
        return id;
    }

    public boolean deleteForUser(UUID recipeId, UUID userId) {
        int rows = jdbc.update(
            "DELETE FROM caygiaphaso.recipe_reactions WHERE recipe_id = ? AND user_id = ?",
            recipeId, userId);
        return rows > 0;
    }

    public Optional<RecipeReaction> findUserReaction(UUID recipeId, UUID userId) {
        try {
            RecipeReaction r = jdbc.queryForObject(
                "SELECT * FROM caygiaphaso.recipe_reactions WHERE recipe_id = ? AND user_id = ?",
                ROW_MAPPER, recipeId, userId);
            return Optional.ofNullable(r);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public List<ReactionCount> counts(UUID recipeId) {
        return jdbc.query(
            "SELECT reaction_type, COUNT(*) AS cnt " +
            "FROM caygiaphaso.recipe_reactions WHERE recipe_id = ? " +
            "GROUP BY reaction_type",
            (rs, n) -> new ReactionCount(
                ReactionType.valueOf(rs.getString("reaction_type")),
                rs.getLong("cnt")
            ), recipeId);
    }

    /** Per-user listing used by GET /reactions. */
    public List<UserReactionRow> listForRecipe(UUID recipeId) {
        return jdbc.query(
            "SELECT rr.reaction_type, rr.user_id, u.full_name, u.avatar_url, rr.created_at " +
            "FROM caygiaphaso.recipe_reactions rr " +
            "JOIN caygiaphaso.users u ON u.id = rr.user_id " +
            "WHERE rr.recipe_id = ? ORDER BY rr.created_at DESC",
            (rs, n) -> new UserReactionRow(
                ReactionType.valueOf(rs.getString("reaction_type")),
                (UUID) rs.getObject("user_id"),
                rs.getString("full_name"),
                rs.getString("avatar_url"),
                toOffset(rs.getTimestamp("created_at"))
            ), recipeId);
    }

    public record ReactionCount(ReactionType type, long count) {}

    public record UserReactionRow(ReactionType reactionType, UUID userId,
                                  String fullName, String avatarUrl, OffsetDateTime createdAt) {}

    private static OffsetDateTime toOffset(Timestamp ts) {
        return ts == null ? null : ts.toInstant().atOffset(ZoneOffset.UTC);
    }
}