package com.giapha.service;

import com.giapha.exception.BadRequestException;
import com.giapha.exception.ForbiddenException;
import com.giapha.exception.ResourceNotFoundException;
import com.giapha.exception.TimeCapsuleLockedException;
import com.giapha.model.dto.tc.CreateTimeCapsuleRequest;
import com.giapha.model.entity.Notification;
import com.giapha.model.entity.TimeCapsule;
import com.giapha.model.entity.User;
import com.giapha.repository.NotificationRepository;
import com.giapha.repository.TimeCapsuleRepository;
import com.giapha.repository.UserRepository;
import com.giapha.security.CurrentUser;
import com.giapha.util.AuthorizationHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TimeCapsuleService {

    private final TimeCapsuleRepository capsuleRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final AuthorizationHelper authz;
    private final CurrentUser currentUser;
    private final JdbcTemplate jdbc;

    public Map<String, Object> list(UUID familyId, String status, UUID recipientId) {
        authz.requireFamilyMember(currentUser.getCurrentUserId(), familyId);

        // The frontend uses friendly lowercase tokens ('sealed', 'available', 'opened'),
        // but the SQL view/computed status is uppercase ('LOCKED', 'AVAILABLE', 'OPENED').
        // Translate here so the filter is case-insensitive and survives renames.
        String dbStatus = mapFilterToStatus(status);
        var rows = capsuleRepository.listWithStatus(familyId, dbStatus, recipientId);
        var items = new java.util.ArrayList<Map<String, Object>>();
        for (var r : rows) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("capsule", r.capsule);
            item.put("creator", Map.of("id", r.capsule.getCreatorId(), "fullName", r.creatorName));
            if (r.capsule.getRecipientMemberId() != null) {
                item.put("recipient", Map.of("id", r.capsule.getRecipientMemberId(), "fullName", r.recipientName));
            } else {
                item.put("recipient", null);
            }
            item.put("daysUntilUnlock", r.daysUntilUnlock);
            item.put("isUnlockable", "AVAILABLE".equals(r.status) || "OPENED".equals(r.status));
            items.add(item);
        }
        return Map.of("capsules", items);
    }

    @Transactional
    public Map<String, Object> create(UUID familyId, CreateTimeCapsuleRequest req) {
        UUID userId = currentUser.getCurrentUserId();
        authz.requireFamilyMember(userId, familyId);

        if (req.getUnlockDate() == null || req.getUnlockDate().isBefore(LocalDate.now(ZoneOffset.UTC))) {
            throw new BadRequestException("unlockDate phải ở tương lai");
        }
        if (!"DATE".equals(req.getUnlockCondition())
            && !"EVENT".equals(req.getUnlockCondition())
            && !"MANUAL".equals(req.getUnlockCondition())) {
            throw new BadRequestException("unlockCondition không hợp lệ");
        }

        if (req.getRecipientMemberId() != null) {
            try {
                UUID recipientFamily = jdbc.queryForObject(
                    "SELECT family_id FROM caygiaphaso.family_members WHERE id = ?",
                    UUID.class, req.getRecipientMemberId());
                if (recipientFamily == null || !recipientFamily.equals(familyId)) {
                    throw new BadRequestException("Người nhận phải thuộc gia tộc này");
                }
            } catch (org.springframework.dao.EmptyResultDataAccessException ex) {
                throw new BadRequestException("Người nhận phải thuộc gia tộc này");
            }
        }

        TimeCapsule tc = TimeCapsule.builder()
            .familyId(familyId)
            .creatorId(userId)
            .title(req.getTitle())
            .content(req.getContent())
            .mediaUrl(req.getMediaUrl())
            .recipientMemberId(req.getRecipientMemberId())
            .unlockDate(req.getUnlockDate())
            .unlockCondition(req.getUnlockCondition())
            .unlockEvent(req.getUnlockEvent())
            .isOpened(false)
            .build();
        UUID id = capsuleRepository.insert(tc);

        // Notify recipient
        if (req.getRecipientMemberId() != null) {
            try {
                UUID recipientUserId = jdbc.queryForObject(
                    "SELECT user_id FROM caygiaphaso.family_members WHERE id = ?",
                    UUID.class, req.getRecipientMemberId());
                if (recipientUserId != null) {
                    notificationRepository.insert(Notification.builder()
                        .userId(recipientUserId)
                        .notificationType("TIME_CAPSULE_CREATED")
                        .title("Bạn nhận được một time capsule mới")
                        .content("Một thành viên đã tạo time capsule dành cho bạn.")
                        .relatedEntityType("TIME_CAPSULE")
                        .relatedEntityId(id)
                        .build());
                }
            } catch (Exception ignore) {}
        }

        TimeCapsule saved = capsuleRepository.findById(id).orElseThrow();
        long days = saved.getUnlockDate() != null
            ? (long) (saved.getUnlockDate().toEpochDay() - LocalDate.now(ZoneOffset.UTC).toEpochDay())
            : 0L;

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("capsule", saved);
        out.put("daysUntilUnlock", days);
        return out;
    }

    @Transactional
    public Map<String, Object> open(UUID capsuleId) {
        TimeCapsule tc = capsuleRepository.findById(capsuleId)
            .orElseThrow(() -> new ResourceNotFoundException("TimeCapsule", capsuleId.toString()));

        UUID userId = currentUser.getCurrentUserId();
        authz.requireFamilyMember(userId, tc.getFamilyId());

        boolean isCreator = tc.getCreatorId().equals(userId);
        boolean isFamilyAdmin = authz.isFamilyAdmin(userId, tc.getFamilyId());

        // Determine if this user is the recipient (linked via family_members.user_id)
        boolean isRecipient = false;
        if (tc.getRecipientMemberId() != null) {
            try {
                UUID recipientUserId = jdbc.queryForObject(
                    "SELECT user_id FROM caygiaphaso.family_members WHERE id = ?",
                    UUID.class, tc.getRecipientMemberId());
                isRecipient = userId.equals(recipientUserId);
            } catch (Exception ignore) {}
        }

        if (!isCreator && !isFamilyAdmin && !isRecipient) {
            throw new ForbiddenException("Bạn không có quyền mở capsule này");
        }

        if (Boolean.TRUE.equals(tc.getIsOpened())) {
            return Map.of("capsule", tc, "content", tc.getContent());
        }

        // Validate unlock state
        switch (tc.getUnlockCondition()) {
            case "DATE" -> {
                if (tc.getUnlockDate() != null && tc.getUnlockDate().isAfter(LocalDate.now(ZoneOffset.UTC))) {
                    long days = tc.getUnlockDate().toEpochDay() - LocalDate.now(ZoneOffset.UTC).toEpochDay();
                    throw new TimeCapsuleLockedException(days);
                }
            }
            case "EVENT" -> {
                // For EVENT unlock, only family ADMIN can force open (manual override).
                if (!isFamilyAdmin) {
                    throw new TimeCapsuleLockedException(-1);
                }
            }
            case "MANUAL" -> {
                // Only ADMIN may open manual capsules before an explicit release.
                if (!isFamilyAdmin) {
                    throw new TimeCapsuleLockedException(-1);
                }
            }
        }

        capsuleRepository.markOpened(capsuleId, userId);
        TimeCapsule opened = capsuleRepository.findById(capsuleId).orElseThrow();

        // Notify creator that the capsule was opened
        if (!tc.getCreatorId().equals(userId)) {
            notificationRepository.insert(Notification.builder()
                .userId(tc.getCreatorId())
                .notificationType("TIME_CAPSULE_OPENED")
                .title("Time capsule đã được mở")
                .content("Time capsule \"" + tc.getTitle() + "\" đã được mở.")
                .relatedEntityType("TIME_CAPSULE")
                .relatedEntityId(capsuleId)
                .build());
        }

        return Map.of("capsule", opened, "content", opened.getContent());
    }

    @Transactional
    public Map<String, Object> delete(UUID capsuleId) {
        TimeCapsule tc = capsuleRepository.findById(capsuleId)
            .orElseThrow(() -> new ResourceNotFoundException("TimeCapsule", capsuleId.toString()));

        UUID userId = currentUser.getCurrentUserId();
        boolean isCreator = tc.getCreatorId().equals(userId);
        boolean isFamilyAdmin = authz.isFamilyAdmin(userId, tc.getFamilyId());
        if (!isCreator && !isFamilyAdmin) {
            throw new ForbiddenException("Chỉ người tạo hoặc ADMIN mới có thể xoá");
        }

        capsuleRepository.delete(capsuleId);
        return Map.of("message", "Time capsule deleted");
    }

    /**
     * Map a UI-facing status token (lowercase, friendly) to the SQL-computed
     * status (uppercase). Returns null when no filter is requested so the
     * repository returns every capsule.
     */
    private String mapFilterToStatus(String filter) {
        if (filter == null || filter.isBlank()) return null;
        return switch (filter.trim().toLowerCase()) {
            case "sealed"    -> "LOCKED";
            case "available" -> "AVAILABLE";
            case "opened"    -> "OPENED";
            // Best-effort pass-through — covers future statuses added without
            // changing the frontend.
            default -> filter.trim().toUpperCase();
        };
    }
}