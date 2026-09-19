package com.giapha.service;

import com.giapha.exception.ForbiddenException;
import com.giapha.exception.ResourceNotFoundException;
import com.giapha.model.entity.Notification;
import com.giapha.repository.NotificationRepository;
import com.giapha.security.CurrentUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final CurrentUser currentUser;

    private static final int MAX_PAGE_SIZE = 100;

    public Map<String, Object> list(boolean unreadOnly, Integer page, Integer size) {
        UUID userId = currentUser.getCurrentUserId();
        int p = page == null ? 0 : Math.max(page, 0);
        int s = size == null ? 20 : Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        int offset = p * s;

        List<Notification> items = notificationRepository.list(userId, unreadOnly, s, offset);
        int total = notificationRepository.count(userId, unreadOnly);

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("notifications", items);
        out.put("total", total);
        out.put("unreadCount", unreadOnly ? total : notificationRepository.count(userId, true));
        out.put("page", p);
        out.put("size", s);
        return out;
    }

    @Transactional
    public Map<String, Object> markRead(UUID notificationId) {
        UUID userId = currentUser.getCurrentUserId();
        Notification n = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new ResourceNotFoundException("Notification", notificationId.toString()));
        if (!n.getUserId().equals(userId)) {
            throw new ForbiddenException("Bạn không có quyền với thông báo này");
        }
        notificationRepository.markRead(notificationId, userId);
        Notification after = notificationRepository.findById(notificationId).orElseThrow();
        return Map.of("notification", after);
    }

    @Transactional
    public Map<String, Object> markAllRead() {
        UUID userId = currentUser.getCurrentUserId();
        int count = notificationRepository.markAllRead(userId);
        return Map.of("count", count);
    }
}