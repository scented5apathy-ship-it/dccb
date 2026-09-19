package com.giapha.repository;

import com.giapha.model.dto.recipe.RecipeDto;
import com.giapha.model.dto.recipe.RecipeWithStats;
import com.giapha.model.entity.Difficulty;
import com.giapha.model.entity.Recipe;
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

/**
 * Recipe CRUD + filterable list queries against the {@code caygiaphaso.recipes}
 * table. Uses raw SQL so we can keep the educational value of the schema.
 */
@Repository
public class RecipeRepository {

    private final JdbcTemplate jdbc;

    public RecipeRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    // ------------------------------------------------------------------ //
    // RowMappers
    // ------------------------------------------------------------------ //

    private static final RowMapper<Recipe> RECIPE_ROW_MAPPER = (rs, n) -> {
        Recipe r = new Recipe();
        r.setId((UUID) rs.getObject("id"));
        r.setFamilyId((UUID) rs.getObject("family_id"));
        r.setAuthorId((UUID) rs.getObject("author_id"));
        r.setTitle(rs.getString("title"));
        r.setDescription(rs.getString("description"));
        r.setStory(rs.getString("story"));
        r.setCuisineType(rs.getString("cuisine_type"));
        String diff = rs.getString("difficulty");
        r.setDifficulty(diff == null ? null : Difficulty.valueOf(diff));
        r.setPrepTimeMinutes((Integer) rs.getObject("prep_time_minutes"));
        r.setCookTimeMinutes((Integer) rs.getObject("cook_time_minutes"));
        r.setServings((Integer) rs.getObject("servings"));
        r.setInstructions(rs.getString("instructions"));
        r.setImageUrl(rs.getString("image_url"));
        r.setIsPublic(rs.getBoolean("is_public"));
        r.setViewCount(rs.getInt("view_count"));
        r.setCreatedAt(toOffset(rs.getTimestamp("created_at")));
        r.setUpdatedAt(toOffset(rs.getTimestamp("updated_at")));
        return r;
    };

    private static final RowMapper<RecipeDto> RECIPE_DTO_MAPPER = (rs, n) -> RecipeDto.builder()
        .id((UUID) rs.getObject("id"))
        .familyId((UUID) rs.getObject("family_id"))
        .authorId((UUID) rs.getObject("author_id"))
        .title(rs.getString("title"))
        .description(rs.getString("description"))
        .story(rs.getString("story"))
        .cuisineType(rs.getString("cuisine_type"))
        .difficulty(Difficulty.valueOf(rs.getString("difficulty")))
        .prepTimeMinutes((Integer) rs.getObject("prep_time_minutes"))
        .cookTimeMinutes((Integer) rs.getObject("cook_time_minutes"))
        .servings((Integer) rs.getObject("servings"))
        .instructions(rs.getString("instructions"))
        .imageUrl(rs.getString("image_url"))
        .isPublic(rs.getBoolean("is_public"))
        .viewCount(rs.getInt("view_count"))
        .createdAt(toOffset(rs.getTimestamp("created_at")))
        .updatedAt(toOffset(rs.getTimestamp("updated_at")))
        .build();

    /**
     * Family-scoped list with optional cuisine/difficulty/search/author filters
     * and cursor-style pagination. Each row is enriched with author summary +
     * reaction/comment/origin counts in a single round-trip.
     */
    public List<RecipeWithStats> listForFamily(UUID familyId, String cuisine, String difficulty,
                                              String search, UUID authorId, int limit, int offset) {
        StringBuilder sql = new StringBuilder()
            .append("SELECT r.*, ")
            .append("       a.id AS author_id, a.full_name AS author_full_name, a.email AS author_email, a.avatar_url AS author_avatar_url, ")
            .append("       (SELECT COUNT(*) FROM caygiaphaso.recipe_reactions  WHERE recipe_id = r.id) AS reaction_count, ")
            .append("       (SELECT COUNT(*) FROM caygiaphaso.recipe_comments   WHERE recipe_id = r.id) AS comment_count, ")
            .append("       (SELECT COUNT(*) FROM caygiaphaso.recipe_origins    WHERE recipe_id = r.id) AS origin_count ")
            .append("FROM caygiaphaso.recipes r ")
            .append("LEFT JOIN caygiaphaso.users a ON a.id = r.author_id ");

        List<Object> args = new java.util.ArrayList<>();
        List<String> where = new java.util.ArrayList<>();
        where.add("r.family_id = ?");
        args.add(familyId);
        if (cuisine != null && !cuisine.isBlank()) {
            where.add("r.cuisine_type = ?");
            args.add(cuisine);
        }
        if (difficulty != null && !difficulty.isBlank()) {
            where.add("r.difficulty = ?");
            args.add(difficulty);
        }
        if (search != null && !search.isBlank()) {
            where.add("(LOWER(r.title) LIKE ? OR LOWER(COALESCE(r.description, '')) LIKE ?)");
            String like = "%" + search.toLowerCase() + "%";
            args.add(like);
            args.add(like);
        }
        if (authorId != null) {
            where.add("r.author_id = ?");
            args.add(authorId);
        }
        sql.append("WHERE ").append(String.join(" AND ", where))
           .append(" ORDER BY r.created_at DESC LIMIT ? OFFSET ?");
        args.add(limit);
        args.add(offset);

        return jdbc.query(sql.toString(), (rs, n) -> {
            UUID authorDbId = (UUID) rs.getObject("author_id");
            return RecipeWithStats.builder()
                .recipe(RECIPE_DTO_MAPPER.mapRow(rs, n))
                .author(authorDbId == null ? null : new com.giapha.model.dto.common.UserSummary(
                    authorDbId,
                    rs.getString("author_full_name"),
                    rs.getString("author_email"),
                    rs.getString("author_avatar_url")
                ))
                .reactions(java.util.Map.of(
                    "total", rs.getInt("reaction_count")
                ))
                .comments(rs.getInt("comment_count"))
                .origins(rs.getInt("origin_count"))
                .viewCount(rs.getInt("view_count"))
                .build();
        }, args.toArray());
    }

    public int countForFamily(UUID familyId, String cuisine, String difficulty,
                              String search, UUID authorId) {
        StringBuilder sql = new StringBuilder("SELECT COUNT(*) FROM caygiaphaso.recipes r ");
        List<Object> args = new java.util.ArrayList<>();
        List<String> where = new java.util.ArrayList<>();
        where.add("r.family_id = ?");
        args.add(familyId);
        if (cuisine != null && !cuisine.isBlank()) {
            where.add("r.cuisine_type = ?");
            args.add(cuisine);
        }
        if (difficulty != null && !difficulty.isBlank()) {
            where.add("r.difficulty = ?");
            args.add(difficulty);
        }
        if (search != null && !search.isBlank()) {
            where.add("(LOWER(r.title) LIKE ? OR LOWER(COALESCE(r.description, '')) LIKE ?)");
            String like = "%" + search.toLowerCase() + "%";
            args.add(like);
            args.add(like);
        }
        if (authorId != null) {
            where.add("r.author_id = ?");
            args.add(authorId);
        }
        sql.append("WHERE ").append(String.join(" AND ", where));
        Integer c = jdbc.queryForObject(sql.toString(), Integer.class, args.toArray());
        return c == null ? 0 : c;
    }

    public UUID insert(Recipe recipe) {
        UUID id = recipe.getId() != null ? recipe.getId() : UUID.randomUUID();
        Difficulty diff = recipe.getDifficulty() == null ? Difficulty.MEDIUM : recipe.getDifficulty();
        jdbc.update(
            "INSERT INTO caygiaphaso.recipes " +
            "(id, family_id, author_id, title, description, story, cuisine_type, difficulty, " +
            " prep_time_minutes, cook_time_minutes, servings, instructions, image_url, is_public, view_count) " +
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            id, recipe.getFamilyId(), recipe.getAuthorId(),
            recipe.getTitle(), recipe.getDescription(), recipe.getStory(),
            recipe.getCuisineType(), diff.name(),
            recipe.getPrepTimeMinutes(), recipe.getCookTimeMinutes(), recipe.getServings(),
            recipe.getInstructions(), recipe.getImageUrl(),
            Boolean.TRUE.equals(recipe.getIsPublic()), 0
        );
        return id;
    }

    public Optional<Recipe> findById(UUID id) {
        List<Recipe> rows = jdbc.query(
            "SELECT * FROM caygiaphaso.recipes WHERE id = ?", RECIPE_ROW_MAPPER, id);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    public Optional<RecipeDto> findDtoById(UUID id) {
        List<RecipeDto> rows = jdbc.query(
            "SELECT * FROM caygiaphaso.recipes WHERE id = ?", RECIPE_DTO_MAPPER, id);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    /**
     * Partial update - only non-null fields are written. We use COALESCE so the
     * existing value is preserved when the caller omits a field.
     */
    public void update(UUID id, String title, String description, String story, String cuisineType,
                       String difficulty, Integer prepTime, Integer cookTime, Integer servings,
                       String instructions, String imageUrl, Boolean isPublic) {
        jdbc.update(
            "UPDATE caygiaphaso.recipes SET " +
            "title = COALESCE(?, title), " +
            "description = COALESCE(?, description), " +
            "story = COALESCE(?, story), " +
            "cuisine_type = COALESCE(?, cuisine_type), " +
            "difficulty = COALESCE(?, difficulty), " +
            "prep_time_minutes = COALESCE(?, prep_time_minutes), " +
            "cook_time_minutes = COALESCE(?, cook_time_minutes), " +
            "servings = COALESCE(?, servings), " +
            "instructions = COALESCE(?, instructions), " +
            "image_url = COALESCE(?, image_url), " +
            "is_public = COALESCE(?, is_public) " +
            "WHERE id = ?",
            title, description, story, cuisineType, difficulty,
            prepTime, cookTime, servings, instructions, imageUrl, isPublic, id
        );
    }

    public void delete(UUID id) {
        try {
            jdbc.update("DELETE FROM caygiaphaso.recipes WHERE id = ?", id);
        } catch (EmptyResultDataAccessException ignore) {
            // idempotent delete
        }
    }

    public void incrementViewCount(UUID id) {
        jdbc.update("UPDATE caygiaphaso.recipes SET view_count = view_count + 1 WHERE id = ?", id);
    }

    // ------------------------------------------------------------------ //
    // Public search
    // ------------------------------------------------------------------ //

    public List<RecipeWithStats> searchPublic(String cuisine, String difficulty, String search,
                                              String sort, int limit, int offset) {
        StringBuilder sql = new StringBuilder()
            .append("SELECT r.*, ")
            .append("       a.id AS author_id, a.full_name AS author_full_name, a.email AS author_email, a.avatar_url AS author_avatar_url, ")
            .append("       f.name AS family_name, ")
            .append("       (SELECT COUNT(*) FROM caygiaphaso.recipe_reactions WHERE recipe_id = r.id) AS reaction_count, ")
            .append("       (SELECT COUNT(*) FROM caygiaphaso.recipe_comments  WHERE recipe_id = r.id) AS comment_count, ")
            .append("       (SELECT COUNT(*) FROM caygiaphaso.recipe_origins   WHERE recipe_id = r.id) AS origin_count ")
            .append("FROM caygiaphaso.recipes r ")
            .append("JOIN caygiaphaso.users a    ON a.id = r.author_id ")
            .append("JOIN caygiaphaso.families f ON f.id = r.family_id ");

        List<Object> args = new java.util.ArrayList<>();
        List<String> where = new java.util.ArrayList<>();
        where.add("r.is_public = TRUE");
        if (cuisine != null && !cuisine.isBlank()) {
            where.add("r.cuisine_type = ?");
            args.add(cuisine);
        }
        if (difficulty != null && !difficulty.isBlank()) {
            where.add("r.difficulty = ?");
            args.add(difficulty);
        }
        if (search != null && !search.isBlank()) {
            where.add("(LOWER(r.title) LIKE ? OR LOWER(COALESCE(r.description, '')) LIKE ?)");
            String like = "%" + search.toLowerCase() + "%";
            args.add(like);
            args.add(like);
        }
        sql.append("WHERE ").append(String.join(" AND ", where));

        String orderBy = switch (sort == null ? "recent" : sort.toLowerCase()) {
            case "popular"   -> "ORDER BY r.view_count DESC, reaction_count DESC, r.created_at DESC";
            case "trending"  -> "ORDER BY reaction_count DESC, r.created_at DESC";
            default          -> "ORDER BY r.created_at DESC";
        };
        sql.append(' ').append(orderBy).append(" LIMIT ? OFFSET ?");
        args.add(limit);
        args.add(offset);

        return jdbc.query(sql.toString(), (rs, n) -> {
            UUID authorDbId = (UUID) rs.getObject("author_id");
            return RecipeWithStats.builder()
                .recipe(RECIPE_DTO_MAPPER.mapRow(rs, n))
                .author(authorDbId == null ? null : new com.giapha.model.dto.common.UserSummary(
                    authorDbId,
                    rs.getString("author_full_name"),
                    rs.getString("author_email"),
                    rs.getString("author_avatar_url")
                ))
                .reactions(java.util.Map.of("total", rs.getInt("reaction_count")))
                .comments(rs.getInt("comment_count"))
                .origins(rs.getInt("origin_count"))
                .viewCount(rs.getInt("view_count"))
                .build();
        }, args.toArray());
    }

    public int countPublic(String cuisine, String difficulty, String search) {
        StringBuilder sql = new StringBuilder("SELECT COUNT(*) FROM caygiaphaso.recipes r ");
        List<Object> args = new java.util.ArrayList<>();
        List<String> where = new java.util.ArrayList<>();
        where.add("r.is_public = TRUE");
        if (cuisine != null && !cuisine.isBlank()) {
            where.add("r.cuisine_type = ?");
            args.add(cuisine);
        }
        if (difficulty != null && !difficulty.isBlank()) {
            where.add("r.difficulty = ?");
            args.add(difficulty);
        }
        if (search != null && !search.isBlank()) {
            where.add("(LOWER(r.title) LIKE ? OR LOWER(COALESCE(r.description, '')) LIKE ?)");
            String like = "%" + search.toLowerCase() + "%";
            args.add(like);
            args.add(like);
        }
        sql.append("WHERE ").append(String.join(" AND ", where));
        Integer c = jdbc.queryForObject(sql.toString(), Integer.class, args.toArray());
        return c == null ? 0 : c;
    }

    /**
     * Lookup helper for the public search payload - returns family name for the row.
     */
    public String familyNameForRecipe(UUID recipeId) {
        try {
            return jdbc.queryForObject(
                "SELECT f.name FROM caygiaphaso.recipes r " +
                "JOIN caygiaphaso.families f ON f.id = r.family_id " +
                "WHERE r.id = ?",
                String.class, recipeId);
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    private static OffsetDateTime toOffset(Timestamp ts) {
        return ts == null ? null : ts.toInstant().atOffset(ZoneOffset.UTC);
    }
}