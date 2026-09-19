package com.giapha.service;

import com.giapha.exception.BadRequestException;
import com.giapha.exception.ForbiddenException;
import com.giapha.exception.ResourceNotFoundException;
import com.giapha.model.dto.event.CreateEventRequest;
import com.giapha.model.dto.event.RsvpRequest;
import com.giapha.model.dto.event.UpdateEventRequest;
import com.giapha.model.entity.*;
import com.giapha.repository.*;
import com.giapha.security.CurrentUser;
import com.giapha.util.AuthorizationHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;
    private final EventAttendeeRepository attendeeRepository;
    private final EventPhotoRepository eventPhotoRepository;
    private final UserRepository userRepository;
    private final AuthorizationHelper authz;
    private final CurrentUser currentUser;
    private final JdbcTemplate jdbc;

    private static final int MAX_PAGE_SIZE = 100;

    public Map<String, Object> list(UUID familyId, String type, Boolean upcoming, Boolean past,
                                    Integer page, Integer size) {
        authz.requireFamilyMember(currentUser.getCurrentUserId(), familyId);
        int p = page == null ? 0 : Math.max(page, 0);
        int s = size == null ? 20 : Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        int offset = p * s;

        List<Event> events = eventRepository.list(familyId, type, upcoming, past, s, offset);
        int total = eventRepository.count(familyId, type, upcoming, past);

        List<Map<String, Object>> items = new ArrayList<>();
        for (Event e : events) {
            int attendeeCount = eventRepository.countAttendees(e.getId());
            int goingCount = eventRepository.countAttendeesByStatus(e.getId(), "GOING");
            User creator = userRepository.findById(e.getCreatorId()).orElse(null);
            // Use LinkedHashMap (not Map.of) so that null fields on the creator
            // (e.g. avatarUrl or fullName on a freshly-registered user) don't
            // throw NullPointerException.
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("event", e);
            Map<String, Object> creatorInfo = null;
            if (creator != null) {
                creatorInfo = new LinkedHashMap<>();
                creatorInfo.put("id", creator.getId());
                creatorInfo.put("fullName", creator.getFullName());
                creatorInfo.put("avatarUrl", creator.getAvatarUrl());
            }
            item.put("creator", creatorInfo);
            item.put("attendeeCount", attendeeCount);
            item.put("goingCount", goingCount);
            items.add(item);
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("events", items);
        out.put("total", total);
        out.put("page", p);
        out.put("size", s);
        return out;
    }

    @Transactional
    public Map<String, Object> create(UUID familyId, CreateEventRequest req) {
        UUID userId = currentUser.getCurrentUserId();
        authz.requireFamilyMember(userId, familyId);

        Event e = Event.builder()
            .familyId(familyId)
            .creatorId(userId)
            .title(req.getTitle())
            .description(req.getDescription())
            .eventType(req.getEventType())
            .eventDate(req.getEventDate())
            .endDate(req.getEndDate())
            .location(req.getLocation())
            .latitude(req.getLatitude())
            .longitude(req.getLongitude())
            .coverImageUrl(req.getCoverImageUrl())
            .build();
        UUID eventId = eventRepository.insert(e);

        UUID creatorMemberId = resolveMemberId(userId, familyId);
        if (creatorMemberId != null) {
            attendeeRepository.upsert(eventId, creatorMemberId, "GOING", null);
        }
        if (req.getAttendeeMemberIds() != null) {
            for (UUID memberId : req.getAttendeeMemberIds()) {
                if (!memberBelongsToFamily(memberId, familyId)) {
                    throw new BadRequestException("Thành viên " + memberId + " không thuộc gia tộc này");
                }
                attendeeRepository.upsert(eventId, memberId, "PENDING", null);
            }
        }

        Event saved = eventRepository.findById(eventId).orElseThrow();
        List<EventAttendee> attendees = attendeeRepository.listByEvent(eventId);
        return Map.of("event", saved, "attendees", attendees);
    }

    /**
     * Fetch a single event with hydrated creator + attendees + photos.
     * Used by the event detail page (`/events/{id}`).
     */
    public Map<String, Object> get(UUID eventId) {
        Event e = eventRepository.findById(eventId)
            .orElseThrow(() -> new ResourceNotFoundException("Event", eventId.toString()));
        UUID userId = currentUser.getCurrentUserId();
        authz.requireFamilyMember(userId, e.getFamilyId());

        User creator = userRepository.findById(e.getCreatorId()).orElse(null);
        List<EventAttendee> attendees = attendeeRepository.listByEvent(eventId);

        // Use LinkedHashMap so null avatarUrl/fullName doesn't NPE.
        Map<String, Object> creatorInfo = null;
        if (creator != null) {
            creatorInfo = new LinkedHashMap<>();
            creatorInfo.put("id", creator.getId());
            creatorInfo.put("fullName", creator.getFullName());
            creatorInfo.put("avatarUrl", creator.getAvatarUrl());
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("event", e);
        out.put("creator", creatorInfo);
        out.put("attendees", attendees);
        out.put("attendeeCount", attendees.size());
        out.put("goingCount", attendees.stream()
            .filter(a -> "GOING".equals(a.getRsvpStatus())).count());
        return out;
    }

    @Transactional
    public Map<String, Object> update(UUID eventId, UpdateEventRequest req) {
        Event existing = eventRepository.findById(eventId)
            .orElseThrow(() -> new ResourceNotFoundException("Event", eventId.toString()));
        UUID userId = currentUser.getCurrentUserId();

        boolean isCreator = existing.getCreatorId().equals(userId);
        boolean isAdmin = authz.isFamilyAdmin(userId, existing.getFamilyId());
        if (!isCreator && !isAdmin) {
            throw new ForbiddenException("Chỉ người tạo hoặc ADMIN mới có thể chỉnh sửa");
        }

        Event update = Event.builder()
            .title(req.getTitle() != null ? req.getTitle() : existing.getTitle())
            .description(req.getDescription() != null ? req.getDescription() : existing.getDescription())
            .eventType(req.getEventType() != null ? req.getEventType() : existing.getEventType())
            .eventDate(req.getEventDate() != null ? req.getEventDate() : existing.getEventDate())
            .endDate(req.getEndDate() != null ? req.getEndDate() : existing.getEndDate())
            .location(req.getLocation() != null ? req.getLocation() : existing.getLocation())
            .latitude(req.getLatitude() != null ? req.getLatitude() : existing.getLatitude())
            .longitude(req.getLongitude() != null ? req.getLongitude() : existing.getLongitude())
            .coverImageUrl(req.getCoverImageUrl() != null ? req.getCoverImageUrl() : existing.getCoverImageUrl())
            .build();
        eventRepository.update(eventId, update);
        Event after = eventRepository.findById(eventId).orElseThrow();
        return Map.of("event", after);
    }

    @Transactional
    public Map<String, Object> delete(UUID eventId) {
        Event existing = eventRepository.findById(eventId)
            .orElseThrow(() -> new ResourceNotFoundException("Event", eventId.toString()));
        UUID userId = currentUser.getCurrentUserId();

        boolean isCreator = existing.getCreatorId().equals(userId);
        boolean isAdmin = authz.isFamilyAdmin(userId, existing.getFamilyId());
        if (!isCreator && !isAdmin) {
            throw new ForbiddenException("Chỉ người tạo hoặc ADMIN mới có thể xoá");
        }
        eventRepository.delete(eventId);
        return Map.of("message", "Event deleted");
    }

    @Transactional
    public Map<String, Object> rsvp(UUID eventId, RsvpRequest req) {
        Event e = eventRepository.findById(eventId)
            .orElseThrow(() -> new ResourceNotFoundException("Event", eventId.toString()));
        UUID userId = currentUser.getCurrentUserId();
        authz.requireFamilyMember(userId, e.getFamilyId());

        if (!"GOING".equals(req.getRsvpStatus())
            && !"MAYBE".equals(req.getRsvpStatus())
            && !"NOT_GOING".equals(req.getRsvpStatus())) {
            throw new BadRequestException("rsvpStatus không hợp lệ");
        }

        if (req.getMemberId() != null && !memberBelongsToFamily(req.getMemberId(), e.getFamilyId())) {
            throw new BadRequestException("Thành viên không thuộc gia tộc của sự kiện này");
        }

        UUID id = attendeeRepository.upsert(eventId, req.getMemberId(), req.getRsvpStatus(), req.getNotes());
        EventAttendee a = attendeeRepository.findById(id).orElseThrow();
        return Map.of("attendee", a);
    }

    @Transactional
    public Map<String, Object> addPhoto(UUID eventId, String photoUrl, String caption) {
        Event e = eventRepository.findById(eventId)
            .orElseThrow(() -> new ResourceNotFoundException("Event", eventId.toString()));
        UUID userId = currentUser.getCurrentUserId();
        authz.requireFamilyMember(userId, e.getFamilyId());

        UUID id = eventPhotoRepository.insert(eventId, photoUrl, caption, userId);
        EventPhoto photo = eventPhotoRepository.listByEvent(eventId).stream()
            .filter(p -> p.getId().equals(id)).findFirst().orElseThrow();
        return Map.of("photo", photo);
    }

    public Map<String, Object> listPhotos(UUID eventId) {
        Event e = eventRepository.findById(eventId)
            .orElseThrow(() -> new ResourceNotFoundException("Event", eventId.toString()));
        authz.requireFamilyMember(currentUser.getCurrentUserId(), e.getFamilyId());

        List<EventPhoto> photos = eventPhotoRepository.listByEvent(eventId);
        List<UUID> uploaderIds = photos.stream().map(EventPhoto::getUploadedBy).distinct().toList();
        Map<UUID, User> uploaders = new HashMap<>();
        for (UUID id : uploaderIds) {
            userRepository.findById(id).ifPresent(u -> uploaders.put(id, u));
        }

        List<Map<String, Object>> items = new ArrayList<>();
        for (EventPhoto p : photos) {
            User u = uploaders.get(p.getUploadedBy());
            items.add(Map.of(
                "photo", p,
                "uploader", u == null ? null : Map.of(
                    "id", u.getId(), "fullName", u.getFullName(), "avatarUrl", u.getAvatarUrl()
                )
            ));
        }
        return Map.of("photos", items);
    }

    private UUID resolveMemberId(UUID userId, UUID familyId) {
        try {
            return jdbc.queryForObject(
                "SELECT id FROM caygiaphaso.family_members WHERE family_id = ? AND user_id = ?",
                UUID.class, familyId, userId);
        } catch (EmptyResultDataAccessException e) {
            return null;
        }
    }

    private boolean memberBelongsToFamily(UUID memberId, UUID familyId) {
        try {
            UUID actualFamily = jdbc.queryForObject(
                "SELECT family_id FROM caygiaphaso.family_members WHERE id = ?",
                UUID.class, memberId);
            return actualFamily != null && actualFamily.equals(familyId);
        } catch (EmptyResultDataAccessException e) {
            return false;
        }
    }
}