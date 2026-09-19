package com.giapha.service;

import com.giapha.exception.ForbiddenException;
import com.giapha.exception.ResourceNotFoundException;
import com.giapha.model.dto.achievement.AwardAchievementRequest;
import com.giapha.model.entity.Achievement;
import com.giapha.model.entity.MemberAchievement;
import com.giapha.model.entity.Notification;
import com.giapha.repository.AchievementRepository;
import com.giapha.repository.NotificationRepository;
import com.giapha.security.CurrentUser;
import com.giapha.util.AuthorizationHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class AchievementService {

    private final AchievementRepository achievementRepository;
    private final NotificationRepository notificationRepository;
    private final AuthorizationHelper authz;
    private final CurrentUser currentUser;
    private final JdbcTemplate jdbc;

    public Map<String, Object> list() {
        List<Achievement> all = achievementRepository.listAll();
        List<Map<String, Object>> items = new ArrayList<>();
        for (Achievement a : all) {
            items.add(Map.of("achievement", a));
        }
        return Map.of("achievements", items);
    }

    public Map<String, Object> listForMember(UUID memberId) {
        UUID userId = currentUser.getCurrentUserId();
        // Member's family must include this user
        UUID familyId;
        try {
            familyId = jdbc.queryForObject(
                "SELECT family_id FROM caygiaphaso.family_members WHERE id = ?",
                UUID.class, memberId);
        } catch (Exception e) {
            throw new ResourceNotFoundException("Member", memberId.toString());
        }
        authz.requireFamilyMember(userId, familyId);

        List<MemberAchievement> earned = achievementRepository.listByMember(memberId);
        Set<UUID> achievementIds = new HashSet<>();
        for (var ma : earned) achievementIds.add(ma.getAchievementId());
        Map<UUID, Achievement> byId = new HashMap<>();
        for (UUID id : achievementIds) {
            achievementRepository.findById(id).ifPresent(a -> byId.put(id, a));
        }

        List<Map<String, Object>> items = new ArrayList<>();
        for (MemberAchievement ma : earned) {
            items.add(Map.of(
                "memberAchievement", ma,
                "achievement", byId.get(ma.getAchievementId())
            ));
        }
        return Map.of("memberAchievements", items);
    }

    @Transactional
    public Map<String, Object> award(UUID memberId, AwardAchievementRequest req) {
        UUID userId = currentUser.getCurrentUserId();

        UUID familyId;
        try {
            familyId = jdbc.queryForObject(
                "SELECT family_id FROM caygiaphaso.family_members WHERE id = ?",
                UUID.class, memberId);
        } catch (Exception e) {
            throw new ResourceNotFoundException("Member", memberId.toString());
        }
        if (!authz.isFamilyAdmin(userId, familyId)) {
            throw new ForbiddenException("Chỉ ADMIN mới có thể trao thành tích");
        }

        Achievement ach = achievementRepository.findByCode(req.getAchievementCode())
            .orElseThrow(() -> new ResourceNotFoundException("Achievement", req.getAchievementCode()));

        var result = achievementRepository.award(memberId, ach.getId(), req.getNotes());

        // Notify the member if they have a linked user account
        try {
            UUID memberUserId = jdbc.queryForObject(
                "SELECT user_id FROM caygiaphaso.family_members WHERE id = ?",
                UUID.class, memberId);
            if (memberUserId != null) {
                notificationRepository.insert(Notification.builder()
                    .userId(memberUserId)
                    .notificationType("ACHIEVEMENT_AWARDED")
                    .title("Bạn vừa nhận thành tích mới: " + ach.getName())
                    .content("Bạn đã được trao thành tích " + ach.getName() + ".")
                    .relatedEntityType("ACHIEVEMENT")
                    .relatedEntityId(ach.getId())
                    .build());
            }
        } catch (Exception ignore) {}

        return Map.of(
            "memberAchievement", result.memberAchievement(),
            "alreadyHad", result.alreadyHad()
        );
    }
}