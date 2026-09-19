package com.giapha.controller;

import com.giapha.model.dto.event.CreateEventRequest;
import com.giapha.model.dto.event.EventPhotoRequest;
import com.giapha.model.dto.event.RsvpRequest;
import com.giapha.model.dto.event.UpdateEventRequest;
import com.giapha.service.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    @GetMapping("/families/{familyId}/events")
    public Map<String, Object> list(
            @PathVariable UUID familyId,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Boolean upcoming,
            @RequestParam(required = false) Boolean past,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        return eventService.list(familyId, type, upcoming, past, page, size);
    }

    @PostMapping("/families/{familyId}/events")
    public Map<String, Object> create(@PathVariable UUID familyId,
                                      @RequestBody CreateEventRequest req) {
        return eventService.create(familyId, req);
    }

    @PutMapping("/events/{eventId}")
    public Map<String, Object> update(@PathVariable UUID eventId,
                                      @RequestBody UpdateEventRequest req) {
        return eventService.update(eventId, req);
    }

    @DeleteMapping("/events/{eventId}")
    public Map<String, Object> delete(@PathVariable UUID eventId) {
        return eventService.delete(eventId);
    }

    @PostMapping("/events/{eventId}/rsvp")
    public Map<String, Object> rsvp(@PathVariable UUID eventId,
                                    @RequestBody RsvpRequest req) {
        return eventService.rsvp(eventId, req);
    }

    @PostMapping("/events/{eventId}/photos")
    public Map<String, Object> addPhoto(@PathVariable UUID eventId,
                                        @RequestBody EventPhotoRequest req) {
        return eventService.addPhoto(eventId, req.getPhotoUrl(), req.getCaption());
    }

    @GetMapping("/events/{eventId}/photos")
    public Map<String, Object> listPhotos(@PathVariable UUID eventId) {
        return eventService.listPhotos(eventId);
    }
}