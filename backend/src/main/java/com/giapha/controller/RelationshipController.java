package com.giapha.controller;

import com.giapha.model.dto.common.MessageResponse;
import com.giapha.model.dto.relationship.CreateRelationshipRequest;
import com.giapha.model.dto.relationship.RelationshipDto;
import com.giapha.model.dto.relationship.UpdateRelationshipRequest;
import com.giapha.security.CustomUserDetails;
import com.giapha.service.RelationshipService;
import com.giapha.util.AuthorizationHelper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/relationships")
@RequiredArgsConstructor
public class RelationshipController {

    private final RelationshipService relationshipService;
    private final AuthorizationHelper authHelper;

    /**
     * List every relationship edge in a family. Mirrors the front-end's
     * {@code familyApi.relationships(familyId)} call shape: returns a flat
     * JSON array (not wrapped in {@code {"relationships": [...]}}).
     */
    @GetMapping
    public ResponseEntity<List<com.giapha.model.entity.Relationship>> listByFamily(
            @RequestParam UUID familyId,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        authHelper.requireFamilyMember(currentUser.getId(), familyId);
        return ResponseEntity.ok(relationshipService.list(familyId, currentUser.getUser()));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> create(
            @Valid @RequestBody CreateRelationshipRequest req,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        RelationshipDto r = relationshipService.create(req, currentUser.getUser());
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("relationship", r));
    }

    @PutMapping("/{relationshipId}")
    public ResponseEntity<Map<String, Object>> update(
            @PathVariable UUID relationshipId,
            @Valid @RequestBody UpdateRelationshipRequest req,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        RelationshipDto r = relationshipService.update(relationshipId, req, currentUser.getUser());
        return ResponseEntity.ok(Map.of("relationship", r));
    }

    @DeleteMapping("/{relationshipId}")
    public ResponseEntity<MessageResponse> delete(
            @PathVariable UUID relationshipId,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        return ResponseEntity.ok(relationshipService.delete(relationshipId, currentUser.getUser()));
    }
}
