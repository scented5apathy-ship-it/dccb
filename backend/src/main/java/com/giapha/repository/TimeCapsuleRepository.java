package com.giapha.repository;

import com.giapha.model.entity.TimeCapsule;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class TimeCapsuleRepository {

    private final JdbcTemplate jdbc;

    public TimeCapsuleRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private static final RowMapper<TimeCapsule> ROW_MAPPER = (rs, n) -> {
        TimeCapsule t = new TimeCapsule();
        t.setId((UUID) rs.getObject("id"));
        t.setFamilyId((UUID) rs.getObject("family_id"));
        t.setCreatorId((UUID) rs.getObject("creator_id"));
        t.setTitle(rs.getString("title"));
        t.setContent(rs.getString("content"));
        t.setMediaUrl(rs.getString("media_url"));
        t.setRecipientMemberId((UUID) rs.getObject("recipient_member_id"));
        t.setUnlockDate(rs.getObject("unlock_date", LocalDate.class));
        t.setUnlockCondition(rs.getString("unlock_condition"));
        t.setUnlockEvent(rs.getString("unlock_event"));
        t.setIsOpened(rs.getBoolean("is_opened"));
        t.setOpenedAt(rs.getObject("opened_at", OffsetDateTime.class));
        t.setOpenedBy((UUID) rs.getObject("opened_by"));
        t.setCreatedAt(rs.getObject("created_at", OffsetDateTime.class));
        return t;
    };

    public UUID insert(TimeCapsule tc) {
        UUID id = UUID.randomUUID();
        jdbc.update(
            "INSERT INTO caygiaphaso.time_capsules " +
            "(id, family_id, creator_id, title, content, media_url, recipient_member_id, " +
            " unlock_date, unlock_condition, unlock_event) " +
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            id, tc.getFamilyId(), tc.getCreatorId(), tc.getTitle(), tc.getContent(),
            tc.getMediaUrl(), tc.getRecipientMemberId(),
            tc.getUnlockDate(), tc.getUnlockCondition(), tc.getUnlockEvent()
        );
        return id;
    }

    public Optional<TimeCapsule> findById(UUID id) {
        List<TimeCapsule> rows = jdbc.query(
            "SELECT * FROM caygiaphaso.time_capsules WHERE id = ?", ROW_MAPPER, id);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    public void markOpened(UUID id, UUID openedBy) {
        jdbc.update(
            "UPDATE caygiaphaso.time_capsules " +
            "SET is_opened = TRUE, opened_at = NOW(), opened_by = ? WHERE id = ?",
            openedBy, id);
    }

    public void delete(UUID id) {
        jdbc.update("DELETE FROM caygiaphaso.time_capsules WHERE id = ?", id);
    }

    /**
     * Lists capsules in a family with a computed status (OPENED, AVAILABLE, LOCKED)
     * and days_until_unlock for DATE-based unlocks. Filters apply on top.
     */
    public List<CapsuleRow> listWithStatus(UUID familyId, String status, UUID recipientId) {
        StringBuilder sql = new StringBuilder(
            "SELECT tc.id, tc.family_id, tc.creator_id, tc.title, tc.content, tc.media_url, " +
            "tc.recipient_member_id, tc.unlock_date, tc.unlock_condition, tc.unlock_event, " +
            "tc.is_opened, tc.opened_at, tc.opened_by, tc.created_at, " +
            "creator.full_name AS creator_name, recipient.full_name AS recipient_name, " +
            "CASE " +
            "  WHEN tc.is_opened THEN 'OPENED' " +
            "  WHEN tc.unlock_condition = 'DATE' AND tc.unlock_date IS NOT NULL " +
            "       AND tc.unlock_date <= CURRENT_DATE THEN 'AVAILABLE' " +
            "  ELSE 'LOCKED' " +
            "END AS status, " +
            "CASE " +
            "  WHEN tc.unlock_condition = 'DATE' AND tc.unlock_date IS NOT NULL " +
            "  THEN (tc.unlock_date - CURRENT_DATE) ELSE NULL " +
            "END AS days_until_unlock " +
            "FROM caygiaphaso.time_capsules tc " +
            "JOIN caygiaphaso.users creator ON creator.id = tc.creator_id " +
            "LEFT JOIN caygiaphaso.family_members recipient ON recipient.id = tc.recipient_member_id " +
            "WHERE tc.family_id = ? ");
        List<Object> args = new java.util.ArrayList<>();
        args.add(familyId);
        if (recipientId != null) {
            sql.append("AND tc.recipient_member_id = ? ");
            args.add(recipientId);
        }
        sql.append("ORDER BY tc.created_at DESC");
        List<CapsuleRow> rows = jdbc.query(sql.toString(),
            (rs, n) -> mapCapsuleRow(rs, true), args.toArray());
        if (status == null || status.isBlank()) return rows;
        return rows.stream().filter(r -> status.equalsIgnoreCase(r.status)).toList();
    }

    public static class CapsuleRow {
        public TimeCapsule capsule;
        public String creatorName;
        public String recipientName;
        public String status;
        public Long daysUntilUnlock;
    }

    private static CapsuleRow mapCapsuleRow(java.sql.ResultSet rs, boolean join) throws java.sql.SQLException {
        CapsuleRow r = new CapsuleRow();
        r.capsule = ROW_MAPPER.mapRow(rs, 0);
        if (join) {
            r.creatorName = rs.getString("creator_name");
            r.recipientName = rs.getString("recipient_name");
            r.status = rs.getString("status");
            long d = rs.getLong("days_until_unlock");
            r.daysUntilUnlock = rs.wasNull() ? null : d;
        }
        return r;
    }

    /** Compute days_until_unlock for a single capsule (used during open validation). */
    public long daysUntilUnlock(UUID id) {
        Long v = jdbc.queryForObject(
            "SELECT (unlock_date - CURRENT_DATE) " +
            "FROM caygiaphaso.time_capsules " +
            "WHERE id = ? AND unlock_condition = 'DATE' AND unlock_date IS NOT NULL",
            Long.class, id);
        return v == null ? -1 : v;
    }
}