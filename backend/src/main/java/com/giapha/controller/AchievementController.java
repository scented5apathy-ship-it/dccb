package com.giapha.controller;

import com.giapha.model.dto.achievement.AwardAchievementRequest;
import com.giapha.service.AchievementService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class AchievementController {

    private final AchievementService achievementService;

    @GetMapping("/achievements")
    public Map<String, Object> list() {
        return achievementService.list();
    }

    @GetMapping("/members/{memberId}/achievements")
    public Map<String, Object> listForMember(@PathVariable UUID memberId) {
        return achievementService.listForMember(memberId);
    }

    @PostMapping("/members/{memberId}/achievements")
    public Map<String, Object> award(@PathVariable UUID memberId,
                                     @RequestBody AwardAchievementRequest req) {
        return achievementService.award(memberId, req);
    }
}