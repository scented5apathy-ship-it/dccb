package com.giapha.repository;

import com.giapha.model.entity.FamilyInvitation;
import com.giapha.model.entity.FamilyRole;
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
 * Raw-SQL access to caygiaphaso.family_invitations.
 */
@Repository
@RequiredArgsConstructor
public class FamilyInvitationRepository {

    private final JdbcTemplate jdbc;

    private static final RowMapper<FamilyInvitation> INV_MAPPER = (rs, rowNum) -> FamilyInvitation.builder()
        .id(rs.getObject("id", UUID.class))
        .familyId(rs.getObject("family_id", UUID.class))
        .inviterId(rs.getObject("inviter_id", UUID.class))
        .inviteeEmail(rs.getString("invitee_email"))
        .inviteCode(rs.getString("invite_code"))
        .role(parseRole(rs.getString("role")))
        .expiresAt(toOffset(rs.getTimestamp("expires_at")))
        .acceptedAt(toOffset(rs.getTimestamp("accepted_at")))
        .createdAt(toOffset(rs.getTimestamp("created_at")))
        .build();

    public FamilyInvitation insert(FamilyInvitation inv) {
        UUID id = inv.getId() != null ? inv.getId() : UUID.randomUUID();
        jdbc.update(
            "INSERT INTO caygiaphaso.family_invitations " +
            "(id, family_id, inviter_id, invitee_email, invite_code, role, expires_at, created_at) " +
            "VALUES (?, ?, ?, ?, ?, ?, ?, NOW())",
            id,
            inv.getFamilyId(),
            inv.getInviterId(),
            inv.getInviteeEmail(),
            inv.getInviteCode(),
            inv.getRole().name(),
            Timestamp.from(inv.getExpiresAt().toInstant())
        );
        return findById(id).orElseThrow(() ->
            new IllegalStateException("Failed to load invitation after insert: " + id));
    }

    public Optional<FamilyInvitation> findById(UUID id) {
        try {
            FamilyInvitation r = jdbc.queryForObject(
                "SELECT * FROM caygiaphaso.family_invitations WHERE id = ?", INV_MAPPER, id);
            return Optional.ofNullable(r);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public Optional<FamilyInvitation> findByInviteCode(String code) {
        try {
            FamilyInvitation r = jdbc.queryForObject(
                "SELECT * FROM caygiaphaso.family_invitations WHERE invite_code = ?", INV_MAPPER, code);
            return Optional.ofNullable(r);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    /**
     * Latest accepted invitation whose invitee_email matches the user's email.
     * Used to determine the user's effective role in a family.
     */
    public Optional<FamilyInvitation> findAcceptedRole(UUID familyId, String email) {
        try {
            FamilyInvitation r = jdbc.queryForObject(
                "SELECT * FROM caygiaphaso.family_invitations " +
                "WHERE family_id = ? AND invitee_email = ? AND accepted_at IS NOT NULL " +
                "ORDER BY accepted_at DESC LIMIT 1",
                INV_MAPPER, familyId, email);
            return Optional.ofNullable(r);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public void markAccepted(UUID id) {
        jdbc.update(
            "UPDATE caygiaphaso.family_invitations SET accepted_at = NOW() WHERE id = ?", id);
    }

    public boolean existsByInviteCode(String code) {
        Integer c = jdbc.queryForObject(
            "SELECT COUNT(*) FROM caygiaphaso.family_invitations WHERE invite_code = ?",
            Integer.class, code);
        return c != null && c > 0;
    }

    public List<FamilyInvitation> findByFamilyId(UUID familyId) {
        return jdbc.query(
            "SELECT * FROM caygiaphaso.family_invitations " +
            "WHERE family_id = ? ORDER BY created_at DESC",
            INV_MAPPER, familyId);
    }

    /** Mark an invitation as revoked so it can no longer be used. */
    public void revoke(UUID id) {
        jdbc.update(
            "UPDATE caygiaphaso.family_invitations " +
            "SET expires_at = LEAST(expires_at, NOW() - INTERVAL '1 second') " +
            "WHERE id = ? AND accepted_at IS NULL",
            id);
    }

    // helpers
    private static FamilyRole parseRole(String s) {
        if (s == null) return null;
        try { return FamilyRole.valueOf(s); } catch (Exception e) { return null; }
    }
    private static OffsetDateTime toOffset(Timestamp t) {
        return t == null ? null : t.toInstant().atOffset(ZoneOffset.UTC);
    }
}
