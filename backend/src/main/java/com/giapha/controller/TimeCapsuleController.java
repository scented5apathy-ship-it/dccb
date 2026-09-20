package com.giapha.controller;

import com.giapha.model.dto.tc.CreateTimeCapsuleRequest;
import com.giapha.service.TimeCapsuleService;
import com.giapha.security.CustomUserDetails;
import com.giapha.util.AuthorizationHelper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class TimeCapsuleController {

    private final TimeCapsuleService timeCapsuleService;
    private final AuthorizationHelper authHelper;

    @GetMapping("/families/{familyId}/time-capsules")
    public Map<String, Object> list(
            @PathVariable UUID familyId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID recipientId,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        authHelper.requireFamilyMember(currentUser.getId(), familyId);
        return timeCapsuleService.list(familyId, status, recipientId);
    }

    @PostMapping("/families/{familyId}/time-capsules")
    public Map<String, Object> create(@PathVariable UUID familyId,
                                      @Valid @RequestBody CreateTimeCapsuleRequest req,
                                      @AuthenticationPrincipal CustomUserDetails currentUser) {
        authHelper.requireFamilyMember(currentUser.getId(), familyId);
        return timeCapsuleService.create(familyId, req);
    }

    /**
     * Seal-screen preview for a single capsule. Returns metadata + creator/recipient
     * names + unlock countdown, but never the sealed `content` — that only comes
     * back from {@code POST /time-capsules/{id}/open} once the unlock conditions
     * are satisfied.
     */
    @GetMapping("/time-capsules/{capsuleId}")
    public Map<String, Object> get(@PathVariable UUID capsuleId) {
        return timeCapsuleService.get(capsuleId);
    }

    @PostMapping("/time-capsules/{capsuleId}/open")
    public Map<String, Object> open(@PathVariable UUID capsuleId) {
        return timeCapsuleService.open(capsuleId);
    }

    @DeleteMapping("/time-capsules/{capsuleId}")
    public Map<String, Object> delete(@PathVariable UUID capsuleId) {
        return timeCapsuleService.delete(capsuleId);
    }
}