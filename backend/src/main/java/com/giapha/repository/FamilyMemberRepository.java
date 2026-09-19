package com.giapha.repository;

import com.giapha.model.entity.FamilyMember;
import com.giapha.model.entity.Gender;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.Date;
import java.sql.Timestamp;
import java.sql.Types;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Raw-SQL access to caygiaphaso.family_members.
 */
@Repository
@RequiredArgsConstructor
public class FamilyMemberRepository {

    private final JdbcTemplate jdbc;

    private static final String COLUMNS =
        "id, family_id, user_id, full_name, nickname, avatar_url, gender, " +
        "birth_date, death_date, birth_place, current_location, occupation, " +
        "biography, generation_id, is_alive, created_at, updated_at";

    private static final RowMapper<FamilyMember> MEMBER_MAPPER = (rs, rowNum) -> FamilyMember.builder()
        .id(rs.getObject("id", UUID.class))
        .familyId(rs.getObject("family_id", UUID.class))
        .userId(rs.getObject("user_id", UUID.class))
        .fullName(rs.getString("full_name"))
        .nickname(rs.getString("nickname"))
        .avatarUrl(rs.getString("avatar_url"))
        .gender(parseGender(rs.getString("gender")))
        .birthDate(toLocalDate(rs.getDate("birth_date")))
        .deathDate(toLocalDate(rs.getDate("death_date")))
        .birthPlace(rs.getString("birth_place"))
        .currentLocation(rs.getString("current_location"))
        .occupation(rs.getString("occupation"))
        .biography(rs.getString("biography"))
        .generationId(rs.getObject("generation_id", UUID.class))
        .isAlive(rs.getBoolean("is_alive"))
        .createdAt(toOffset(rs.getTimestamp("created_at")))
        .updatedAt(toOffset(rs.getTimestamp("updated_at")))
        .build();

    // ------------------------------------------------------------------ //
    // CRUD
    // ------------------------------------------------------------------ //

    public FamilyMember insert(FamilyMember m) {
        UUID id = m.getId() != null ? m.getId() : UUID.randomUUID();
        jdbc.update(con -> {
            var ps = con.prepareStatement(
                "INSERT INTO caygiaphaso.family_members " +
                "(id, family_id, user_id, full_name, nickname, avatar_url, gender, " +
                " birth_date, death_date, birth_place, current_location, occupation, " +
                " biography, generation_id, is_alive, created_at, updated_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())");
            ps.setObject(1, id);
            ps.setObject(2, m.getFamilyId());
            setNullableUuid(ps, 3, m.getUserId());
            ps.setString(4, m.getFullName());
            setNullableString(ps, 5, m.getNickname());
            setNullableString(ps, 6, m.getAvatarUrl());
            setNullableString(ps, 7, m.getGender() == null ? null : m.getGender().name());
            ps.setDate(8, m.getBirthDate() == null ? null : Date.valueOf(m.getBirthDate()));
            ps.setDate(9, m.getDeathDate() == null ? null : Date.valueOf(m.getDeathDate()));
            setNullableString(ps, 10, m.getBirthPlace());
            setNullableString(ps, 11, m.getCurrentLocation());
            setNullableString(ps, 12, m.getOccupation());
            setNullableString(ps, 13, m.getBiography());
            setNullableUuid(ps, 14, m.getGenerationId());
            ps.setBoolean(15, m.getIsAlive() == null ? Boolean.TRUE : m.getIsAlive());
            return ps;
        });
        return findById(id).orElseThrow(() ->
            new IllegalStateException("Failed to load member after insert: " + id));
    }

    public Optional<FamilyMember> findById(UUID id) {
        try {
            FamilyMember m = jdbc.queryForObject(
                "SELECT " + COLUMNS + " FROM caygiaphaso.family_members WHERE id = ?",
                MEMBER_MAPPER, id);
            return Optional.ofNullable(m);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public List<FamilyMember> findByFamily(UUID familyId) {
        return jdbc.query(
            "SELECT " + COLUMNS + " FROM caygiaphaso.family_members " +
            "WHERE family_id = ? ORDER BY birth_date ASC NULLS LAST, full_name ASC",
            MEMBER_MAPPER, familyId);
    }

    /**
     * Find the existing family_members row that links a user to a family.
     * Used by the join-family flow to detect duplicate memberships.
     */
    public Optional<FamilyMember> findByUserAndFamily(UUID userId, UUID familyId) {
        try {
            FamilyMember m = jdbc.queryForObject(
                "SELECT " + COLUMNS + " FROM caygiaphaso.family_members " +
                "WHERE user_id = ? AND family_id = ? LIMIT 1",
                MEMBER_MAPPER, userId, familyId);
            return Optional.ofNullable(m);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public void updateFields(UUID id,
                             String fullName, String nickname, String avatarUrl,
                             String gender, LocalDate birthDate, LocalDate deathDate,
                             String birthPlace, String currentLocation,
                             String occupation, String biography,
                             UUID generationId, UUID userId, Boolean isAlive) {
        jdbc.update(
            "UPDATE caygiaphaso.family_members SET " +
            "  full_name        = COALESCE(?, full_name), " +
            "  nickname         = COALESCE(?, nickname), " +
            "  avatar_url       = COALESCE(?, avatar_url), " +
            "  gender           = COALESCE(?, gender), " +
            "  birth_date       = COALESCE(?, birth_date), " +
            "  death_date       = COALESCE(?, death_date), " +
            "  birth_place      = COALESCE(?, birth_place), " +
            "  current_location = COALESCE(?, current_location), " +
            "  occupation       = COALESCE(?, occupation), " +
            "  biography        = COALESCE(?, biography), " +
            "  generation_id    = COALESCE(?, generation_id), " +
            "  user_id          = COALESCE(?, user_id), " +
            "  is_alive         = COALESCE(?, is_alive) " +
            "WHERE id = ?",
            fullName, nickname, avatarUrl, gender,
            birthDate == null ? null : Date.valueOf(birthDate),
            deathDate == null ? null : Date.valueOf(deathDate),
            birthPlace, currentLocation, occupation, biography,
            generationId, userId, isAlive, id
        );
    }

    public void hardDelete(UUID id) {
        jdbc.update("DELETE FROM caygiaphaso.family_members WHERE id = ?", id);
    }

    public void softDelete(UUID id) {
        jdbc.update(
            "UPDATE caygiaphaso.family_members SET is_alive = FALSE, death_date = COALESCE(death_date, CURRENT_DATE) WHERE id = ?",
            id);
    }

    public int countRelationshipsFor(UUID memberId) {
        Integer c = jdbc.queryForObject(
            "SELECT COUNT(*) FROM caygiaphaso.relationships " +
            "WHERE from_member_id = ? OR to_member_id = ?",
            Integer.class, memberId, memberId);
        return c == null ? 0 : c;
    }

    public List<FamilyMember> search(UUID familyId, UUID generationId,
                                     String search, Boolean aliveOnly) {
        StringBuilder sql = new StringBuilder(
            "SELECT " + COLUMNS + " FROM caygiaphaso.family_members WHERE family_id = ?");
        List<Object> params = new ArrayList<>();
        params.add(familyId);
        if (generationId != null) {
            sql.append(" AND generation_id = ?");
            params.add(generationId);
        }
        if (search != null && !search.isBlank()) {
            sql.append(" AND (full_name ILIKE ? OR nickname ILIKE ?)");
            params.add("%" + search.trim() + "%");
            params.add("%" + search.trim() + "%");
        }
        if (Boolean.TRUE.equals(aliveOnly)) {
            sql.append(" AND is_alive = TRUE");
        }
        sql.append(" ORDER BY birth_date ASC NULLS LAST, full_name ASC");
        return jdbc.query(sql.toString(), MEMBER_MAPPER, params.toArray());
    }

    // ------------------------------------------------------------------ //
    // Helpers
    // ------------------------------------------------------------------ //

    private static void setNullableString(java.sql.PreparedStatement ps,
                                          int parameterIndex, String value) throws java.sql.SQLException {
        if (value == null) ps.setNull(parameterIndex, Types.VARCHAR);
        else ps.setString(parameterIndex, value);
    }

    private static void setNullableUuid(java.sql.PreparedStatement ps,
                                        int parameterIndex, UUID value) throws java.sql.SQLException {
        if (value == null) ps.setNull(parameterIndex, Types.OTHER);
        else ps.setObject(parameterIndex, value);
    }

    private static LocalDate toLocalDate(Date d) { return d == null ? null : d.toLocalDate(); }
    private static OffsetDateTime toOffset(Timestamp t) {
        return t == null ? null : t.toInstant().atOffset(ZoneOffset.UTC);
    }
    private static Gender parseGender(String raw) {
        if (raw == null) return null;
        try { return Gender.valueOf(raw); } catch (Exception e) { return null; }
    }
}
