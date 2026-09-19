package com.giapha.repository;

import com.giapha.model.entity.Event;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class EventRepository {

    private final JdbcTemplate jdbc;

    public EventRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private static final RowMapper<Event> ROW_MAPPER = (rs, n) -> {
        Event e = new Event();
        e.setId((UUID) rs.getObject("id"));
        e.setFamilyId((UUID) rs.getObject("family_id"));
        e.setCreatorId((UUID) rs.getObject("creator_id"));
        e.setTitle(rs.getString("title"));
        e.setDescription(rs.getString("description"));
        e.setEventType(rs.getString("event_type"));
        e.setEventDate(rs.getObject("event_date", OffsetDateTime.class));
        e.setEndDate(rs.getObject("end_date", OffsetDateTime.class));
        e.setLocation(rs.getString("location"));
        BigDecimal lat = rs.getBigDecimal("latitude");
        BigDecimal lng = rs.getBigDecimal("longitude");
        e.setLatitude(lat);
        e.setLongitude(lng);
        e.setCoverImageUrl(rs.getString("cover_image_url"));
        e.setCreatedAt(rs.getObject("created_at", OffsetDateTime.class));
        e.setUpdatedAt(rs.getObject("updated_at", OffsetDateTime.class));
        return e;
    };

    public UUID insert(Event e) {
        UUID id = UUID.randomUUID();
        jdbc.update(
            "INSERT INTO caygiaphaso.events " +
            "(id, family_id, creator_id, title, description, event_type, event_date, end_date, " +
            " location, latitude, longitude, cover_image_url) " +
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            id, e.getFamilyId(), e.getCreatorId(), e.getTitle(), e.getDescription(),
            e.getEventType(), e.getEventDate(), e.getEndDate(), e.getLocation(),
            e.getLatitude(), e.getLongitude(), e.getCoverImageUrl()
        );
        return id;
    }

    public Optional<Event> findById(UUID id) {
        List<Event> rows = jdbc.query(
            "SELECT * FROM caygiaphaso.events WHERE id = ?", ROW_MAPPER, id);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    public void update(UUID id, Event e) {
        jdbc.update(
            "UPDATE caygiaphaso.events SET title = ?, description = ?, event_type = ?, " +
            "event_date = ?, end_date = ?, location = ?, latitude = ?, longitude = ?, " +
            "cover_image_url = ? WHERE id = ?",
            e.getTitle(), e.getDescription(), e.getEventType(),
            e.getEventDate(), e.getEndDate(), e.getLocation(),
            e.getLatitude(), e.getLongitude(), e.getCoverImageUrl(), id
        );
    }

    public void delete(UUID id) {
        jdbc.update("DELETE FROM caygiaphaso.events WHERE id = ?", id);
    }

    public List<Event> list(UUID familyId, String type, Boolean upcoming, Boolean past,
                            int limit, int offset) {
        StringBuilder sql = new StringBuilder("SELECT * FROM caygiaphaso.events WHERE family_id = ? ");
        List<Object> args = new java.util.ArrayList<>();
        args.add(familyId);
        if (type != null && !type.isBlank()) {
            sql.append("AND event_type = ? ");
            args.add(type);
        }
        if (Boolean.TRUE.equals(upcoming)) {
            sql.append("AND event_date >= NOW() ");
        }
        if (Boolean.TRUE.equals(past)) {
            sql.append("AND event_date < NOW() ");
        }
        sql.append("ORDER BY event_date DESC LIMIT ? OFFSET ?");
        args.add(limit); args.add(offset);
        return jdbc.query(sql.toString(), ROW_MAPPER, args.toArray());
    }

    public int count(UUID familyId, String type, Boolean upcoming, Boolean past) {
        StringBuilder sql = new StringBuilder(
            "SELECT COUNT(*) FROM caygiaphaso.events WHERE family_id = ? ");
        List<Object> args = new java.util.ArrayList<>();
        args.add(familyId);
        if (type != null && !type.isBlank()) {
            sql.append("AND event_type = ? ");
            args.add(type);
        }
        if (Boolean.TRUE.equals(upcoming)) sql.append("AND event_date >= NOW() ");
        if (Boolean.TRUE.equals(past)) sql.append("AND event_date < NOW() ");
        Integer c = jdbc.queryForObject(sql.toString(), Integer.class, args.toArray());
        return c == null ? 0 : c;
    }

    public int countAttendees(UUID eventId) {
        Integer c = jdbc.queryForObject(
            "SELECT COUNT(*) FROM caygiaphaso.event_attendees WHERE event_id = ?",
            Integer.class, eventId);
        return c == null ? 0 : c;
    }

    public int countAttendeesByStatus(UUID eventId, String status) {
        Integer c = jdbc.queryForObject(
            "SELECT COUNT(*) FROM caygiaphaso.event_attendees " +
            "WHERE event_id = ? AND rsvp_status = ?",
            Integer.class, eventId, status);
        return c == null ? 0 : c;
    }
}