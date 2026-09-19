package com.giapha.repository;

import com.giapha.model.entity.FamilyHeritage;
import com.giapha.model.entity.HeritageType;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.sql.Types;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Raw-SQL access to caygiaphaso.family_heritages.
 */
@Repository
@RequiredArgsConstructor
public class HeritageRepository {

    private final JdbcTemplate jdbc;

    private static final RowMapper<FamilyHeritage> HERITAGE_MAPPER = (rs, rowNum) -> FamilyHeritage.builder()
        .id(rs.getObject("id", UUID.class))
        .familyId(rs.getObject("family_id", UUID.class))
        .heritageType(parse(rs.getString("heritage_type")))
        .title(rs.getString("title"))
        .description(rs.getString("description"))
        .mediaUrl(rs.getString("media_url"))
        .yearEstablished((Integer) rs.getObject("year_established"))
        .createdBy(rs.getObject("created_by", UUID.class))
        .createdAt(toOffset(rs.getTimestamp("created_at")))
        .build();

    public FamilyHeritage insert(FamilyHeritage h) {
        UUID id = h.getId() != null ? h.getId() : UUID.randomUUID();
        jdbc.update(con -> {
            var ps = con.prepareStatement(
                "INSERT INTO caygiaphaso.family_heritages " +
                "(id, family_id, heritage_type, title, description, media_url, year_established, created_by, created_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())");
            ps.setObject(1, id);
            ps.setObject(2, h.getFamilyId());
            ps.setString(3, h.getHeritageType().name());
            ps.setString(4, h.getTitle());
            setNullableString(ps, 5, h.getDescription());
            setNullableString(ps, 6, h.getMediaUrl());
            setNullableInt(ps, 7, h.getYearEstablished());
            ps.setObject(8, h.getCreatedBy());
            return ps;
        });
        return findById(id).orElseThrow(() ->
            new IllegalStateException("Failed to load heritage after insert: " + id));
    }

    public Optional<FamilyHeritage> findById(UUID id) {
        try {
            FamilyHeritage h = jdbc.queryForObject(
                "SELECT * FROM caygiaphaso.family_heritages WHERE id = ?",
                HERITAGE_MAPPER, id);
            return Optional.ofNullable(h);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public List<FamilyHeritage> findByFamily(UUID familyId) {
        return jdbc.query(
            "SELECT * FROM caygiaphaso.family_heritages WHERE family_id = ? ORDER BY created_at DESC",
            HERITAGE_MAPPER, familyId);
    }

    private static HeritageType parse(String s) {
        if (s == null) return null;
        try { return HeritageType.valueOf(s); } catch (Exception e) { return null; }
    }
    private static OffsetDateTime toOffset(Timestamp t) {
        return t == null ? null : t.toInstant().atOffset(ZoneOffset.UTC);
    }
    private static void setNullableString(java.sql.PreparedStatement ps, int i, String v) throws java.sql.SQLException {
        if (v == null) ps.setNull(i, Types.VARCHAR); else ps.setString(i, v);
    }
    private static void setNullableInt(java.sql.PreparedStatement ps, int i, Integer v) throws java.sql.SQLException {
        if (v == null) ps.setNull(i, Types.INTEGER); else ps.setInt(i, v);
    }
}
