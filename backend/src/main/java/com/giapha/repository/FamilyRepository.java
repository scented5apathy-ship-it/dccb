package com.giapha.repository;

import com.giapha.model.entity.Family;
import lombok.RequiredArgsConstructor;
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
 * Raw-SQL access to caygiaphaso.families.
 */
@Repository
@RequiredArgsConstructor
public class FamilyRepository {

    private final JdbcTemplate jdbc;

    private static final String BASE_COLUMNS =
        "id, name, description, founded_year, motto, logo_url, cover_image_url, " +
        "origin_location, member_count, created_by, created_at, updated_at";

    private static final RowMapper<Family> FAMILY_MAPPER = (rs, rowNum) -> Family.builder()
        .id(rs.getObject("id", UUID.class))
        .name(rs.getString("name"))
        .description(rs.getString("description"))
        .foundedYear((Integer) rs.getObject("founded_year"))
        .motto(rs.getString("motto"))
        .logoUrl(rs.getString("logo_url"))
        .coverImageUrl(rs.getString("cover_image_url"))
        .originLocation(rs.getString("origin_location"))
        .memberCount((Integer) rs.getObject("member_count"))
        .createdBy(rs.getObject("created_by", UUID.class))
        .createdAt(toOffsetDateTime(rs.getTimestamp("created_at")))
        .updatedAt(toOffsetDateTime(rs.getTimestamp("updated_at")))
        .build();

    // ---------------------------------------------------------------- //
    public Family insert(Family f) {
        UUID id = f.getId() != null ? f.getId() : UUID.randomUUID();
        jdbc.update(
            "INSERT INTO caygiaphaso.families " +
            "(id, name, description, founded_year, motto, origin_location, " +
            " member_count, created_by, created_at, updated_at) " +
            "VALUES (?, ?, ?, ?, ?, ?, 0, ?, NOW(), NOW())",
            id,
            f.getName(),
            f.getDescription(),
            f.getFoundedYear(),
            f.getMotto(),
            f.getOriginLocation(),
            f.getCreatedBy()
        );
        return findById(id).orElseThrow(() ->
            new IllegalStateException("Failed to load family after insert: " + id));
    }

    public Optional<Family> findById(UUID id) {
        try {
            Family f = jdbc.queryForObject(
                "SELECT " + BASE_COLUMNS + " FROM caygiaphaso.families WHERE id = ?",
                FAMILY_MAPPER, id);
            return Optional.ofNullable(f);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public List<Family> findFamiliesForUser(UUID userId) {
        return jdbc.query(
            "SELECT DISTINCT f.* FROM caygiaphaso.families f " +
            "LEFT JOIN caygiaphaso.family_members fm " +
            "  ON fm.family_id = f.id AND fm.user_id = ? " +
            "WHERE fm.id IS NOT NULL OR f.created_by = ? " +
            "ORDER BY f.created_at DESC",
            FAMILY_MAPPER, userId, userId
        );
    }

    public void updateBasics(UUID id, String name, String description,
                             String motto, String originLocation,
                             String logoUrl, String coverImageUrl) {
        jdbc.update(
            "UPDATE caygiaphaso.families SET " +
            "name = COALESCE(?, name), " +
            "description = COALESCE(?, description), " +
            "motto = COALESCE(?, motto), " +
            "origin_location = COALESCE(?, origin_location), " +
            "logo_url = COALESCE(?, logo_url), " +
            "cover_image_url = COALESCE(?, cover_image_url) " +
            "WHERE id = ?",
            name, description, motto, originLocation, logoUrl, coverImageUrl, id
        );
    }

    public void incrementMemberCount(UUID familyId, int delta) {
        jdbc.update(
            "UPDATE caygiaphaso.families SET member_count = GREATEST(0, COALESCE(member_count, 0) + ?) WHERE id = ?",
            delta, familyId
        );
    }

    public int countRecipes(UUID familyId) {
        Integer c = jdbc.queryForObject(
            "SELECT COUNT(*) FROM caygiaphaso.recipes WHERE family_id = ?",
            Integer.class, familyId);
        return c == null ? 0 : c;
    }

    public int countStories(UUID familyId) {
        Integer c = jdbc.queryForObject(
            "SELECT COUNT(*) FROM caygiaphaso.stories WHERE family_id = ?",
            Integer.class, familyId);
        return c == null ? 0 : c;
    }

    public int countEvents(UUID familyId) {
        Integer c = jdbc.queryForObject(
            "SELECT COUNT(*) FROM caygiaphaso.events WHERE family_id = ?",
            Integer.class, familyId);
        return c == null ? 0 : c;
    }

    public int countHeritage(UUID familyId) {
        Integer c = jdbc.queryForObject(
            "SELECT COUNT(*) FROM caygiaphaso.family_heritages WHERE family_id = ?",
            Integer.class, familyId);
        return c == null ? 0 : c;
    }

    public int countGenerations(UUID familyId) {
        Integer c = jdbc.queryForObject(
            "SELECT COUNT(*) FROM caygiaphaso.generations WHERE family_id = ?",
            Integer.class, familyId);
        return c == null ? 0 : c;
    }

    private static OffsetDateTime toOffsetDateTime(Timestamp ts) {
        return ts == null ? null : ts.toInstant().atOffset(ZoneOffset.UTC);
    }
}
