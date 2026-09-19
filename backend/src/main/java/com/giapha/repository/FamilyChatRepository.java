package com.giapha.repository;

import com.giapha.model.entity.FamilyChat;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class FamilyChatRepository {

    private final JdbcTemplate jdbc;

    public FamilyChatRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private static final RowMapper<FamilyChat> ROW_MAPPER = (rs, n) -> {
        FamilyChat c = new FamilyChat();
        c.setId((UUID) rs.getObject("id"));
        c.setFamilyId((UUID) rs.getObject("family_id"));
        c.setName(rs.getString("name"));
        c.setDescription(rs.getString("description"));
        c.setCreatedBy((UUID) rs.getObject("created_by"));
        c.setCreatedAt(rs.getObject("created_at", OffsetDateTime.class));
        return c;
    };

    public UUID insert(FamilyChat chat) {
        UUID id = UUID.randomUUID();
        jdbc.update(
            "INSERT INTO caygiaphaso.family_chats (id, family_id, name, description, created_by) " +
            "VALUES (?, ?, ?, ?, ?)",
            id, chat.getFamilyId(), chat.getName(), chat.getDescription(), chat.getCreatedBy());
        return id;
    }

    public Optional<FamilyChat> findById(UUID id) {
        List<FamilyChat> rows = jdbc.query(
            "SELECT * FROM caygiaphaso.family_chats WHERE id = ?", ROW_MAPPER, id);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    public List<FamilyChat> listByFamily(UUID familyId) {
        return jdbc.query(
            "SELECT * FROM caygiaphaso.family_chats WHERE family_id = ? ORDER BY created_at DESC",
            ROW_MAPPER, familyId);
    }

    public int countMembers(UUID chatId) {
        Integer c = jdbc.queryForObject(
            "SELECT COUNT(*) FROM caygiaphaso.chat_members WHERE chat_id = ?",
            Integer.class, chatId);
        return c == null ? 0 : c;
    }

    public java.util.Map<String, Object> lastMessage(UUID chatId) {
        return jdbc.query(
            "SELECT id, sender_id, content, message_type, created_at " +
            "FROM caygiaphaso.chat_messages WHERE chat_id = ? ORDER BY created_at DESC LIMIT 1",
            rs -> {
                if (rs.next()) {
                    java.util.LinkedHashMap<String, Object> m = new java.util.LinkedHashMap<>();
                    m.put("id", rs.getObject("id"));
                    m.put("senderId", rs.getObject("sender_id"));
                    m.put("content", rs.getString("content"));
                    m.put("messageType", rs.getString("message_type"));
                    m.put("createdAt", rs.getObject("created_at", OffsetDateTime.class));
                    return m;
                }
                return null;
            }, chatId);
    }
}