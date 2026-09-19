package com.giapha.repository;

import com.giapha.model.entity.Achievement;
import com.giapha.model.entity.MemberAchievement;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class AchievementRepository {

    private final JdbcTemplate jdbc;

    public AchievementRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private static final RowMapper<Achievement> ROW_MAPPER = (rs, n) -> {
        Achievement a = new Achievement();
        a.setId((UUID) rs.getObject("id"));
        a.setCode(rs.getString("code"));
        a.setName(rs.getString("name"));
        a.setDescription(rs.getString("description"));
        a.setIconUrl(rs.getString("icon_url"));
        a.setPoints(rs.getInt("points"));
        return a;
    };

    private static final RowMapper<MemberAchievement> MEMBER_ROW_MAPPER = (rs, n) -> {
        MemberAchievement m = new MemberAchievement();
        m.setId((UUID) rs.getObject("id"));
        m.setMemberId((UUID) rs.getObject("member_id"));
        m.setAchievementId((UUID) rs.getObject("achievement_id"));
        m.setEarnedAt(rs.getObject("earned_at", OffsetDateTime.class));
        m.setNotes(rs.getString("notes"));
        return m;
    };

    public List<Achievement> listAll() {
        return jdbc.query(
            "SELECT * FROM caygiaphaso.achievements ORDER BY points ASC, name ASC",
            ROW_MAPPER);
    }

    public Optional<Achievement> findByCode(String code) {
        List<Achievement> rows = jdbc.query(
            "SELECT * FROM caygiaphaso.achievements WHERE code = ?",
            ROW_MAPPER, code);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    public Optional<Achievement> findById(UUID id) {
        List<Achievement> rows = jdbc.query(
            "SELECT * FROM caygiaphaso.achievements WHERE id = ?",
            ROW_MAPPER, id);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    public List<MemberAchievement> listByMember(UUID memberId) {
        return jdbc.query(
            "SELECT * FROM caygiaphaso.member_achievements " +
            "WHERE member_id = ? ORDER BY earned_at DESC",
            MEMBER_ROW_MAPPER, memberId);
    }

    /**
     * Idempotent award: returns (memberAchievement, alreadyHad). If the member
     * already has the achievement, returns the existing row.
     */
    public AwardResult award(UUID memberId, UUID achievementId, String notes) {
        // Check existing
        List<MemberAchievement> existing = jdbc.query(
            "SELECT * FROM caygiaphaso.member_achievements " +
            "WHERE member_id = ? AND achievement_id = ?",
            MEMBER_ROW_MAPPER, memberId, achievementId);
        if (!existing.isEmpty()) {
            return new AwardResult(existing.get(0), true);
        }
        UUID id = UUID.randomUUID();
        try {
            jdbc.update(
                "INSERT INTO caygiaphaso.member_achievements " +
                "(id, member_id, achievement_id, notes) VALUES (?, ?, ?, ?)",
                id, memberId, achievementId, notes);
        } catch (DuplicateKeyException race) {
            // Race: someone else inserted concurrently
            return jdbc.query(
                "SELECT * FROM caygiaphaso.member_achievements " +
                "WHERE member_id = ? AND achievement_id = ?",
                MEMBER_ROW_MAPPER, memberId, achievementId)
                .stream().findFirst()
                .map(m -> new AwardResult(m, true))
                .orElseThrow();
        }
        return new AwardResult(
            MemberAchievement.builder()
                .id(id).memberId(memberId).achievementId(achievementId)
                .earnedAt(OffsetDateTime.now()).notes(notes)
                .build(),
            false
        );
    }

    public record AwardResult(MemberAchievement memberAchievement, boolean alreadyHad) {}
}