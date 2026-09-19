package com.giapha.controller;

import com.giapha.model.dto.tc.CreateTimeCapsuleRequest;
import com.giapha.service.TimeCapsuleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class TimeCapsuleController {

    private final TimeCapsuleService timeCapsuleService;

    @GetMapping("/families/{familyId}/time-capsules")
    public Map<String, Object> list(
            @PathVariable UUID familyId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID recipientId
    ) {
        return timeCapsuleService.list(familyId, status, recipientId);
    }

    @PostMapping("/families/{familyId}/time-capsules")
    public Map<String, Object> create(@PathVariable UUID familyId,
                                      @Valid @RequestBody CreateTimeCapsuleRequest req) {
        return timeCapsuleService.create(familyId, req);
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