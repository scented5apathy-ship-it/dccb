package com.giapha.controller;

import com.giapha.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/notifications")
    public Map<String, Object> list(
            @RequestParam(required = false) Boolean unreadOnly,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        return notificationService.list(Boolean.TRUE.equals(unreadOnly), page, size);
    }

    @PostMapping("/notifications/{notificationId}/read")
    public Map<String, Object> markRead(@PathVariable UUID notificationId) {
        return notificationService.markRead(notificationId);
    }

    @PostMapping("/notifications/read-all")
    public Map<String, Object> markAllRead() {
        return notificationService.markAllRead();
    }
}