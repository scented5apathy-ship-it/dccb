package com.giapha.repository;

import com.giapha.model.entity.EventAttendee;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class EventAttendeeRepository {

    private final JdbcTemplate jdbc;

    public EventAttendeeRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private static final RowMapper<EventAttendee> ROW_MAPPER = (rs, n) -> {
        EventAttendee a = new EventAttendee();
        a.setId((UUID) rs.getObject("id"));
        a.setEventId((UUID) rs.getObject("event_id"));
        a.setMemberId((UUID) rs.getObject("member_id"));
        a.setRsvpStatus(rs.getString("rsvp_status"));
        a.setNotes(rs.getString("notes"));
        a.setRespondedAt(rs.getObject("responded_at", OffsetDateTime.class));
        return a;
    };

    /**
     * Upserts the RSVP for an event/member pair. Returns the (possibly new) id.
     */
    public UUID upsert(UUID eventId, UUID memberId, String status, String notes) {
        Optional<UUID> existing = findExistingAttendeeId(eventId, memberId);

        if (existing.isPresent()) {
            jdbc.update(
                "UPDATE caygiaphaso.event_attendees SET rsvp_status = ?, notes = ?, " +
                "responded_at = NOW() WHERE id = ?",
                status, notes, existing.get());
            return existing.get();
        }
        UUID id = UUID.randomUUID();
        try {
            jdbc.update(
                "INSERT INTO caygiaphaso.event_attendees " +
                "(id, event_id, member_id, rsvp_status, notes, responded_at) " +
                "VALUES (?, ?, ?, ?, ?, NOW())",
                id, eventId, memberId, status, notes);
        } catch (DuplicateKeyException race) {
            // Lost an insert race — re-query for the id
            return jdbc.queryForObject(
                "SELECT id FROM caygiaphaso.event_attendees " +
                "WHERE event_id = ? AND member_id = ?",
                UUID.class, eventId, memberId);
        }
        return id;
    }

    private Optional<UUID> findExistingAttendeeId(UUID eventId, UUID memberId) {
        return jdbc.query(
            "SELECT id FROM caygiaphaso.event_attendees WHERE event_id = ? AND member_id = ?",
            rs -> rs.next() ? Optional.of((UUID) rs.getObject(1)) : Optional.<UUID>empty(),
            eventId, memberId
        );
    }

    public List<EventAttendee> listByEvent(UUID eventId) {
        return jdbc.query(
            "SELECT * FROM caygiaphaso.event_attendees WHERE event_id = ? ORDER BY responded_at DESC NULLS LAST",
            ROW_MAPPER, eventId);
    }

    public Optional<EventAttendee> findById(UUID id) {
        List<EventAttendee> rows = jdbc.query(
            "SELECT * FROM caygiaphaso.event_attendees WHERE id = ?", ROW_MAPPER, id);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }
}