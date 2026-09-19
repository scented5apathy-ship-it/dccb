package com.giapha.repository;

import com.giapha.model.dto.origin.OriginDto;
import com.giapha.model.entity.RecipeOrigin;
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
public class RecipeOriginRepository {

    private final JdbcTemplate jdbc;

    public RecipeOriginRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private static final RowMapper<RecipeOrigin> ROW_MAPPER = (rs, n) -> RecipeOrigin.builder()
        .id((UUID) rs.getObject("id"))
        .recipeId((UUID) rs.getObject("recipe_id"))
        .fromMemberId((UUID) rs.getObject("from_member_id"))
        .toMemberId((UUID) rs.getObject("to_member_id"))
        .yearTransmitted((Integer) rs.getObject("year_transmitted"))
        .generationGap((Integer) rs.getObject("generation_gap"))
        .story(rs.getString("story"))
        .createdAt(toOffset(rs.getTimestamp("created_at")))
        .build();

    /**
     * Origin with the joined member name + generation metadata. Uses a left
     * join so a member without a generation still appears.
     */
    private static final RowMapper<OriginDto> ORIGIN_DTO_MAPPER = (rs, n) -> {
        UUID fromId = (UUID) rs.getObject("from_member_id");
        UUID toId   = (UUID) rs.getObject("to_member_id");
        return OriginDto.builder()
            .id((UUID) rs.getObject("id"))
            .recipeId((UUID) rs.getObject("recipe_id"))
            .fromMemberId(fromId)
            .toMemberId(toId)
            .yearTransmitted((Integer) rs.getObject("year_transmitted"))
            .generationGap((Integer) rs.getObject("generation_gap"))
            .story(rs.getString("story"))
            .createdAt(toOffset(rs.getTimestamp("created_at")))
            .fromMember(OriginDto.MemberSummary.builder()
                .id(fromId)
                .fullName(rs.getString("from_full_name"))
                .generationNumber((Integer) rs.getObject("from_generation"))
                .generationName(rs.getString("from_generation_name"))
                .build())
            .toMember(OriginDto.MemberSummary.builder()
                .id(toId)
                .fullName(rs.getString("to_full_name"))
                .generationNumber((Integer) rs.getObject("to_generation"))
                .generationName(rs.getString("to_generation_name"))
                .build())
            .build();
    };

    public UUID insert(RecipeOrigin origin) {
        UUID id = origin.getId() != null ? origin.getId() : UUID.randomUUID();
        jdbc.update(
            "INSERT INTO caygiaphaso.recipe_origins " +
            "(id, recipe_id, from_member_id, to_member_id, year_transmitted, generation_gap, story) " +
            "VALUES (?, ?, ?, ?, ?, ?, ?)",
            id, origin.getRecipeId(), origin.getFromMemberId(), origin.getToMemberId(),
            origin.getYearTransmitted(), origin.getGenerationGap(), origin.getStory()
        );
        return id;
    }

    public void replaceAll(UUID recipeId, List<RecipeOrigin> origins) {
        jdbc.update("DELETE FROM caygiaphaso.recipe_origins WHERE recipe_id = ?", recipeId);
        if (origins == null) return;
        for (RecipeOrigin o : origins) {
            o.setRecipeId(recipeId);
            insert(o);
        }
    }

    public Optional<RecipeOrigin> findById(UUID id) {
        List<RecipeOrigin> rows = jdbc.query(
            "SELECT * FROM caygiaphaso.recipe_origins WHERE id = ?", ROW_MAPPER, id);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    public List<RecipeOrigin> findByRecipe(UUID recipeId) {
        return jdbc.query(
            "SELECT * FROM caygiaphaso.recipe_origins WHERE recipe_id = ? ORDER BY year_transmitted NULLS LAST, created_at",
            ROW_MAPPER, recipeId);
    }

    public List<OriginDto> findDtosByRecipe(UUID recipeId) {
        return jdbc.query(
            "SELECT ro.id, ro.recipe_id, ro.from_member_id, ro.to_member_id, " +
            "       ro.year_transmitted, ro.generation_gap, ro.story, ro.created_at, " +
            "       fm.full_name AS from_full_name, gm_from.generation_number AS from_generation, gm_from.name AS from_generation_name, " +
            "       tm.full_name AS to_full_name,   gm_to.generation_number   AS to_generation,   gm_to.name   AS to_generation_name " +
            "FROM caygiaphaso.recipe_origins ro " +
            "JOIN caygiaphaso.family_members fm ON fm.id = ro.from_member_id " +
            "LEFT JOIN caygiaphaso.generations gm_from ON gm_from.id = fm.generation_id " +
            "JOIN caygiaphaso.family_members tm ON tm.id = ro.to_member_id " +
            "LEFT JOIN caygiaphaso.generations gm_to ON gm_to.id = tm.generation_id " +
            "WHERE ro.recipe_id = ? " +
            "ORDER BY ro.year_transmitted NULLS LAST, ro.created_at",
            ORIGIN_DTO_MAPPER, recipeId);
    }

    public void deleteById(UUID id) {
        jdbc.update("DELETE FROM caygiaphaso.recipe_origins WHERE id = ?", id);
    }

    public void deleteByRecipe(UUID recipeId) {
        jdbc.update("DELETE FROM caygiaphaso.recipe_origins WHERE recipe_id = ?", recipeId);
    }

    /**
     * Validate both endpoints of an origin belong to the supplied family.
     * Returns false when either member is missing or in a different family.
     */
    public boolean bothMembersInFamily(UUID fromMemberId, UUID toMemberId, UUID familyId) {
        Integer cnt = jdbc.queryForObject(
            "SELECT COUNT(*) FROM caygiaphaso.family_members " +
            "WHERE family_id = ? AND id IN (?, ?)",
            Integer.class, familyId, fromMemberId, toMemberId);
        return cnt != null && cnt == 2;
    }

    /**
     * CTE-based lineage traversal. Starts with roots (members who only have
     * outgoing origins) and walks the chain down. Returned rows are ordered by
     * depth then year so the tree builder gets a top-down view.
     */
    public List<GenealogyRow> lineage(UUID recipeId) {
        String sql = """
            WITH RECURSIVE lineage AS (
              SELECT
                ro.id, ro.recipe_id,
                ro.from_member_id, ro.to_member_id,
                ro.year_transmitted, ro.generation_gap, ro.story,
                fm.full_name AS from_name,
                gm_from.generation_number AS from_generation,
                gm_from.name AS from_generation_name,
                tm.full_name AS to_name,
                gm_to.generation_number AS to_generation,
                gm_to.name AS to_generation_name,
                0 AS depth,
                ARRAY[ro.from_member_id::text] AS path
              FROM caygiaphaso.recipe_origins ro
              JOIN caygiaphaso.family_members fm ON fm.id = ro.from_member_id
              LEFT JOIN caygiaphaso.generations gm_from ON gm_from.id = fm.generation_id
              JOIN caygiaphaso.family_members tm ON tm.id = ro.to_member_id
              LEFT JOIN caygiaphaso.generations gm_to ON gm_to.id = tm.generation_id
              WHERE ro.recipe_id = ?
                AND NOT EXISTS (
                  SELECT 1 FROM caygiaphaso.recipe_origins ro2
                  WHERE ro2.recipe_id = ro.recipe_id
                    AND ro2.to_member_id = ro.from_member_id
                )

              UNION ALL

              SELECT
                ro.id, ro.recipe_id,
                ro.from_member_id, ro.to_member_id,
                ro.year_transmitted, ro.generation_gap, ro.story,
                fm.full_name, gm_from.generation_number, gm_from.name,
                tm.full_name, gm_to.generation_number, gm_to.name,
                l.depth + 1,
                l.path || ro.from_member_id::text
              FROM caygiaphaso.recipe_origins ro
              JOIN caygiaphaso.family_members fm ON fm.id = ro.from_member_id
              LEFT JOIN caygiaphaso.generations gm_from ON gm_from.id = fm.generation_id
              JOIN caygiaphaso.family_members tm ON tm.id = ro.to_member_id
              LEFT JOIN caygiaphaso.generations gm_to ON gm_to.id = tm.generation_id
              JOIN lineage l ON ro.from_member_id = l.to_member_id
              WHERE ro.recipe_id = ?
                AND NOT (ro.from_member_id::text = ANY(l.path))
            )
            SELECT * FROM lineage ORDER BY depth, year_transmitted NULLS LAST
            """;
        return jdbc.query(sql, (rs, n) -> new GenealogyRow(
            (UUID) rs.getObject("id"),
            (UUID) rs.getObject("recipe_id"),
            (UUID) rs.getObject("from_member_id"),
            (UUID) rs.getObject("to_member_id"),
            (Integer) rs.getObject("year_transmitted"),
            (Integer) rs.getObject("generation_gap"),
            rs.getString("story"),
            rs.getString("from_name"),
            (Integer) rs.getObject("from_generation"),
            rs.getString("from_generation_name"),
            rs.getString("to_name"),
            (Integer) rs.getObject("to_generation"),
            rs.getString("to_generation_name"),
            rs.getInt("depth")
        ), recipeId, recipeId);
    }

    private static OffsetDateTime toOffset(Timestamp ts) {
        return ts == null ? null : ts.toInstant().atOffset(ZoneOffset.UTC);
    }

    /** Flat CTE row used to build the genealogy tree in Java. */
    public record GenealogyRow(
        UUID id,
        UUID recipeId,
        UUID fromMemberId,
        UUID toMemberId,
        Integer yearTransmitted,
        Integer generationGap,
        String story,
        String fromName,
        Integer fromGeneration,
        String fromGenerationName,
        String toName,
        Integer toGeneration,
        String toGenerationName,
        int depth
    ) {}
}