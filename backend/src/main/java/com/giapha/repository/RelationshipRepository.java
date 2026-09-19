package com.giapha.repository;

import com.giapha.model.entity.Relationship;
import com.giapha.model.entity.RelationshipType;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.Date;
import java.sql.Types;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Raw-SQL access to caygiaphaso.relationships.
 */
@Repository
@RequiredArgsConstructor
public class RelationshipRepository {

    private final JdbcTemplate jdbc;

    private static final RowMapper<Relationship> REL_MAPPER = (rs, rowNum) -> Relationship.builder()
        .id(rs.getObject("id", UUID.class))
        .familyId(rs.getObject("family_id", UUID.class))
        .fromMemberId(rs.getObject("from_member_id", UUID.class))
        .toMemberId(rs.getObject("to_member_id", UUID.class))
        .type(parseType(rs.getString("relationship_type")))
        .startDate(toLocal(rs.getDate("start_date")))
        .endDate(toLocal(rs.getDate("end_date")))
        .notes(rs.getString("notes"))
        .createdAt(toOffset(rs.getTimestamp("created_at")))
        .build();

    public Relationship insert(Relationship r) {
        UUID id = r.getId() != null ? r.getId() : UUID.randomUUID();
        jdbc.update(con -> {
            var ps = con.prepareStatement(
                "INSERT INTO caygiaphaso.relationships " +
                "(id, family_id, from_member_id, to_member_id, relationship_type, " +
                " start_date, end_date, notes, created_at) " +
                "VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())");
            ps.setObject(1, id);
            ps.setObject(2, r.getFamilyId());
            ps.setObject(3, r.getFromMemberId());
            ps.setObject(4, r.getToMemberId());
            ps.setString(5, r.getType().name());
            ps.setDate(6, r.getStartDate() == null ? null : Date.valueOf(r.getStartDate()));
            setNullableDate(ps, 7, r.getEndDate());
            setNullableString(ps, 8, r.getNotes());
            return ps;
        });
        return findById(id).orElseThrow(() ->
            new IllegalStateException("Failed to load relationship after insert: " + id));
    }

    public Optional<Relationship> findById(UUID id) {
        try {
            Relationship r = jdbc.queryForObject(
                "SELECT * FROM caygiaphaso.relationships WHERE id = ?",
                REL_MAPPER, id);
            return Optional.ofNullable(r);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public List<Relationship> findAllForFamily(UUID familyId) {
        return jdbc.query(
            "SELECT * FROM caygiaphaso.relationships WHERE family_id = ?",
            REL_MAPPER, familyId);
    }

    public List<Relationship> findAllByMember(UUID memberId) {
        return jdbc.query(
            "SELECT * FROM caygiaphaso.relationships " +
            "WHERE from_member_id = ? OR to_member_id = ?",
            REL_MAPPER, memberId, memberId);
    }

    public boolean existsSpouseLinkFor(UUID memberId) {
        Integer c = jdbc.queryForObject(
            "SELECT COUNT(*) FROM caygiaphaso.relationships " +
            "WHERE relationship_type = 'SPOUSE' " +
            "AND (from_member_id = ? OR to_member_id = ?) " +
            "AND end_date IS NULL",
            Integer.class, memberId, memberId);
        return c != null && c > 0;
    }

    /**
     * Used to keep reciprocal rows in sync: find the matching
     * (toMemberId -> fromMemberId) row, regardless of type.
     */
    public Optional<Relationship> findReciprocal(UUID familyId, UUID from, UUID to, RelationshipType type) {
        try {
            Relationship r = jdbc.queryForObject(
                "SELECT * FROM caygiaphaso.relationships " +
                "WHERE family_id = ? AND from_member_id = ? AND to_member_id = ? AND relationship_type = ?",
                REL_MAPPER, familyId, to, from, type.reciprocal().name());
            return Optional.ofNullable(r);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public void updateEndDateAndNotes(UUID id, LocalDate endDate, String notes) {
        jdbc.update(
            "UPDATE caygiaphaso.relationships SET " +
            "end_date = COALESCE(?, end_date), notes = COALESCE(?, notes) WHERE id = ?",
            endDate == null ? null : Date.valueOf(endDate), notes, id);
    }

    public void hardDeleteById(UUID id) {
        jdbc.update("DELETE FROM caygiaphaso.relationships WHERE id = ?", id);
    }

    public void deletePair(UUID familyId, UUID memberA, UUID memberB, String type) {
        jdbc.update(
            "DELETE FROM caygiaphaso.relationships " +
            "WHERE family_id = ? AND relationship_type = ? " +
            "AND ((from_member_id = ? AND to_member_id = ?) " +
            "   OR (from_member_id = ? AND to_member_id = ?))",
            familyId, type, memberA, memberB, memberB, memberA);
    }

    // helpers
    private static RelationshipType parseType(String s) {
        if (s == null) return null;
        try { return RelationshipType.valueOf(s); } catch (Exception e) { return null; }
    }
    private static LocalDate toLocal(Date d) { return d == null ? null : d.toLocalDate(); }
    private static OffsetDateTime toOffset(java.sql.Timestamp t) {
        return t == null ? null : t.toInstant().atOffset(ZoneOffset.UTC);
    }
    private static void setNullableString(java.sql.PreparedStatement ps, int idx, String v) throws java.sql.SQLException {
        if (v == null) ps.setNull(idx, Types.VARCHAR); else ps.setString(idx, v);
    }
    private static void setNullableDate(java.sql.PreparedStatement ps, int idx, LocalDate v) throws java.sql.SQLException {
        if (v == null) ps.setNull(idx, Types.DATE); else ps.setDate(idx, Date.valueOf(v));
    }
}
