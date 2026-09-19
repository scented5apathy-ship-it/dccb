package com.giapha.controller;

import com.giapha.model.dto.family.CreateFamilyRequest;
import com.giapha.model.dto.family.FamilyDetailDto;
import com.giapha.model.dto.family.FamilyDto;
import com.giapha.model.dto.family.FamilyWithRoleDto;
import com.giapha.model.dto.family.JoinFamilyRequest;
import com.giapha.model.dto.family.UpdateFamilyRequest;
import com.giapha.model.entity.User;
import com.giapha.security.CustomUserDetails;
import com.giapha.service.FamilyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Endpoints for managing families (CâyGiaPhảSố).
 *
 * <pre>
 *  POST   /api/families              — create a new family
 *  GET    /api/families              — list families the current user belongs to
 *  GET    /api/families/{id}         — fetch one family (with generations + heritages + stats)
 *  PUT    /api/families/{id}         — update family metadata (ADMIN only)
 *  POST   /api/families/join         — join via invite code
 * </pre>
 */
@RestController
@RequestMapping("/families")
@RequiredArgsConstructor
public class FamilyController {

    private final FamilyService familyService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> createFamily(
            @Valid @RequestBody CreateFamilyRequest req,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        FamilyDto family = familyService.createFamily(req, currentUser.getUser());
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("family", family));
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> listMyFamilies(
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        List<FamilyWithRoleDto> data = familyService.listFamiliesForUser(currentUser.getUser());
        return ResponseEntity.ok(Map.of("families", data));
    }

    @GetMapping("/join")
    public ResponseEntity<Void> joinGetNotAllowed() {
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).build();
    }

    @PostMapping("/join")
    public ResponseEntity<Map<String, Object>> joinFamily(
            @Valid @RequestBody JoinFamilyRequest req,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        FamilyWithRoleDto data = familyService.joinFamily(req, currentUser.getUser());
        Map<String, Object> body = new java.util.LinkedHashMap<>();
        body.put("family", data.getFamily());
        body.put("role", data.getRole());
        body.put("memberCount", data.getMemberCount());
        return ResponseEntity.ok(body);
    }

    @GetMapping("/{familyId}")
    public ResponseEntity<FamilyDetailDto> getFamily(
            @PathVariable UUID familyId,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        return ResponseEntity.ok(familyService.getFamilyDetail(familyId, currentUser.getUser()));
    }

    @PutMapping("/{familyId}")
    public ResponseEntity<Map<String, Object>> updateFamily(
            @PathVariable UUID familyId,
            @Valid @RequestBody UpdateFamilyRequest req,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        FamilyDto family = familyService.updateFamily(familyId, req, currentUser.getUser());
        return ResponseEntity.ok(Map.of("family", family));
    }
}
