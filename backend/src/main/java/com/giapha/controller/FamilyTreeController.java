package com.giapha.controller;

import com.giapha.model.dto.tree.FamilyTreeResponse;
import com.giapha.security.CustomUserDetails;
import com.giapha.service.FamilyTreeService;
import com.giapha.util.AuthorizationHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Family-tree visualisation endpoint. Lives in its own controller because the
 * payload is structurally different from a normal member listing.
 */
@RestController
@RequiredArgsConstructor
public class FamilyTreeController {

    private final FamilyTreeService treeService;
    private final AuthorizationHelper authHelper;

    @GetMapping("/families/{familyId}/tree")
    public ResponseEntity<FamilyTreeResponse> getTree(
            @PathVariable UUID familyId,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        authHelper.requireFamilyMember(currentUser.getId(), familyId);
        return ResponseEntity.ok(treeService.buildTree(familyId, currentUser.getUser()));
    }
}
