package com.giapha.repository;

import com.giapha.model.entity.EventPhoto;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public class EventPhotoRepository {

    private final JdbcTemplate jdbc;

    public EventPhotoRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private static final RowMapper<EventPhoto> ROW_MAPPER = (rs, n) -> {
        EventPhoto p = new EventPhoto();
        p.setId((UUID) rs.getObject("id"));
        p.setEventId((UUID) rs.getObject("event_id"));
        p.setPhotoUrl(rs.getString("photo_url"));
        p.setCaption(rs.getString("caption"));
        p.setUploadedBy((UUID) rs.getObject("uploaded_by"));
        p.setUploadedAt(rs.getObject("uploaded_at", OffsetDateTime.class));
        return p;
    };

    public UUID insert(UUID eventId, String photoUrl, String caption, UUID uploadedBy) {
        UUID id = UUID.randomUUID();
        jdbc.update(
            "INSERT INTO caygiaphaso.event_photos (id, event_id, photo_url, caption, uploaded_by) " +
            "VALUES (?, ?, ?, ?, ?)",
            id, eventId, photoUrl, caption, uploadedBy);
        return id;
    }

    public List<EventPhoto> listByEvent(UUID eventId) {
        return jdbc.query(
            "SELECT * FROM caygiaphaso.event_photos WHERE event_id = ? ORDER BY uploaded_at DESC",
            ROW_MAPPER, eventId);
    }
}