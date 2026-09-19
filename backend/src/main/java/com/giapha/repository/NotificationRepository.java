package com.giapha.repository;

import com.giapha.model.entity.Notification;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class NotificationRepository {

    private final JdbcTemplate jdbc;

    public NotificationRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private static final RowMapper<Notification> ROW_MAPPER = (rs, n) -> {
        Notification x = new Notification();
        x.setId((UUID) rs.getObject("id"));
        x.setUserId((UUID) rs.getObject("user_id"));
        x.setNotificationType(rs.getString("notification_type"));
        x.setTitle(rs.getString("title"));
        x.setContent(rs.getString("content"));
        x.setRelatedEntityType(rs.getString("related_entity_type"));
        x.setRelatedEntityId((UUID) rs.getObject("related_entity_id"));
        x.setIsRead(rs.getBoolean("is_read"));
        x.setReadAt(rs.getObject("read_at", OffsetDateTime.class));
        x.setCreatedAt(rs.getObject("created_at", OffsetDateTime.class));
        return x;
    };

    public UUID insert(Notification n) {
        UUID id = UUID.randomUUID();
        jdbc.update(
            "INSERT INTO caygiaphaso.notifications " +
            "(id, user_id, notification_type, title, content, related_entity_type, related_entity_id) " +
            "VALUES (?, ?, ?, ?, ?, ?, ?)",
            id, n.getUserId(), n.getNotificationType(), n.getTitle(), n.getContent(),
            n.getRelatedEntityType(), n.getRelatedEntityId());
        return id;
    }

    public Optional<Notification> findById(UUID id) {
        List<Notification> rows = jdbc.query(
            "SELECT * FROM caygiaphaso.notifications WHERE id = ?", ROW_MAPPER, id);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    public List<Notification> list(UUID userId, boolean unreadOnly, int limit, int offset) {
        String sql = "SELECT * FROM caygiaphaso.notifications WHERE user_id = ? "
            + (unreadOnly ? "AND is_read = FALSE " : "")
            + "ORDER BY created_at DESC LIMIT ? OFFSET ?";
        return jdbc.query(sql, ROW_MAPPER, userId, limit, offset);
    }

    public int count(UUID userId, boolean unreadOnly) {
        String sql = "SELECT COUNT(*) FROM caygiaphaso.notifications WHERE user_id = ? "
            + (unreadOnly ? "AND is_read = FALSE" : "");
        Integer c = jdbc.queryForObject(sql, Integer.class, userId);
        return c == null ? 0 : c;
    }

    public void markRead(UUID id, UUID userId) {
        jdbc.update(
            "UPDATE caygiaphaso.notifications SET is_read = TRUE, read_at = NOW() " +
            "WHERE id = ? AND user_id = ?",
            id, userId);
    }

    public int markAllRead(UUID userId) {
        return jdbc.update(
            "UPDATE caygiaphaso.notifications SET is_read = TRUE, read_at = NOW() " +
            "WHERE user_id = ? AND is_read = FALSE",
            userId);
    }
}