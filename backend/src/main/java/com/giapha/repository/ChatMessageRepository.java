package com.giapha.repository;

import com.giapha.model.entity.ChatMessage;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public class ChatMessageRepository {

    private final JdbcTemplate jdbc;

    public ChatMessageRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private static final RowMapper<ChatMessage> ROW_MAPPER = (rs, n) -> {
        ChatMessage m = new ChatMessage();
        m.setId((UUID) rs.getObject("id"));
        m.setChatId((UUID) rs.getObject("chat_id"));
        m.setSenderId((UUID) rs.getObject("sender_id"));
        m.setContent(rs.getString("content"));
        m.setMessageType(rs.getString("message_type"));
        m.setAttachmentUrl(rs.getString("attachment_url"));
        m.setReplyToMessageId((UUID) rs.getObject("reply_to_message_id"));
        m.setCreatedAt(rs.getObject("created_at", OffsetDateTime.class));
        m.setEditedAt(rs.getObject("edited_at", OffsetDateTime.class));
        m.setDeletedAt(rs.getObject("deleted_at", OffsetDateTime.class));
        return m;
    };

    public UUID insert(ChatMessage m) {
        UUID id = UUID.randomUUID();
        jdbc.update(
            "INSERT INTO caygiaphaso.chat_messages " +
            "(id, chat_id, sender_id, content, message_type, attachment_url, reply_to_message_id) " +
            "VALUES (?, ?, ?, ?, ?, ?, ?)",
            id, m.getChatId(), m.getSenderId(), m.getContent(), m.getMessageType(),
            m.getAttachmentUrl(), m.getReplyToMessageId());
        return id;
    }

    /**
     * Cursor-based listing: pass {@code beforeMessageId} to fetch strictly older
     * messages than the given id. Returns newest-first up to limit.
     */
    public List<ChatMessage> list(UUID chatId, UUID beforeMessageId, int limit) {
        if (beforeMessageId == null) {
            return jdbc.query(
                "SELECT * FROM caygiaphaso.chat_messages " +
                "WHERE chat_id = ? ORDER BY created_at DESC LIMIT ?",
                ROW_MAPPER, chatId, limit);
        }
        return jdbc.query(
            "SELECT * FROM caygiaphaso.chat_messages " +
            "WHERE chat_id = ? AND created_at < (" +
            "  SELECT created_at FROM caygiaphaso.chat_messages WHERE id = ?) " +
            "ORDER BY created_at DESC LIMIT ?",
            ROW_MAPPER, chatId, beforeMessageId, limit);
    }

    public ChatMessage findById(UUID id) {
        List<ChatMessage> rows = jdbc.query(
            "SELECT * FROM caygiaphaso.chat_messages WHERE id = ?", ROW_MAPPER, id);
        return rows.isEmpty() ? null : rows.get(0);
    }
}