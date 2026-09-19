package com.giapha.repository;

import com.giapha.model.entity.ChatMember;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class ChatMemberRepository {

    private final JdbcTemplate jdbc;

    public ChatMemberRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private static final RowMapper<ChatMember> ROW_MAPPER = (rs, n) -> {
        ChatMember m = new ChatMember();
        m.setId((UUID) rs.getObject("id"));
        m.setChatId((UUID) rs.getObject("chat_id"));
        m.setUserId((UUID) rs.getObject("user_id"));
        m.setJoinedAt(rs.getObject("joined_at", OffsetDateTime.class));
        m.setLastReadAt(rs.getObject("last_read_at", OffsetDateTime.class));
        m.setRole(rs.getString("role"));
        return m;
    };

    public void add(UUID chatId, UUID userId, String role) {
        try {
            jdbc.update(
                "INSERT INTO caygiaphaso.chat_members (id, chat_id, user_id, role) VALUES (?, ?, ?, ?)",
                UUID.randomUUID(), chatId, userId, role);
        } catch (DuplicateKeyException ignore) {
            // Already a member — keep first role
        }
    }

    public boolean isMember(UUID chatId, UUID userId) {
        Integer c = jdbc.queryForObject(
            "SELECT COUNT(*) FROM caygiaphaso.chat_members WHERE chat_id = ? AND user_id = ?",
            Integer.class, chatId, userId);
        return c != null && c > 0;
    }

    public Optional<ChatMember> find(UUID chatId, UUID userId) {
        List<ChatMember> rows = jdbc.query(
            "SELECT * FROM caygiaphaso.chat_members WHERE chat_id = ? AND user_id = ?",
            ROW_MAPPER, chatId, userId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    public List<UUID> userIdsInChat(UUID chatId) {
        return jdbc.query(
            "SELECT user_id FROM caygiaphaso.chat_members WHERE chat_id = ?",
            (rs, n) -> (UUID) rs.getObject(1), chatId);
    }

    public void updateLastRead(UUID chatId, UUID userId) {
        jdbc.update(
            "UPDATE caygiaphaso.chat_members SET last_read_at = NOW() " +
            "WHERE chat_id = ? AND user_id = ?",
            chatId, userId);
    }

    /**
     * Unread = messages in the chat created strictly after the user's
     * last_read_at. Members without a last_read_at (NULL) see the full history.
     */
    public int unreadCount(UUID chatId, UUID userId) {
        Integer c = jdbc.queryForObject(
            "SELECT COUNT(*) FROM caygiaphaso.chat_messages cm " +
            "WHERE cm.chat_id = ? AND cm.created_at > COALESCE(" +
            "  (SELECT last_read_at FROM caygiaphaso.chat_members " +
            "   WHERE chat_id = ? AND user_id = ?), '1970-01-01'::timestamptz)",
            Integer.class, chatId, chatId, userId);
        return c == null ? 0 : c;
    }
}