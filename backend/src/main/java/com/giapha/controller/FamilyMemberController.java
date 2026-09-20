package com.giapha.controller;

import com.giapha.model.dto.common.MessageResponse;
import com.giapha.model.dto.family.CreateInvitationRequest;
import com.giapha.model.dto.family.InvitationDetailDto;
import com.giapha.model.dto.family.InvitationResponse;
import com.giapha.model.dto.member.CreateMemberRequest;
import com.giapha.model.dto.member.MemberDto;
import com.giapha.model.dto.member.MemberWithRelationships;
import com.giapha.model.dto.member.UpdateMemberRequest;
import com.giapha.model.dto.member.UpdateMemberRoleRequest;
import com.giapha.security.CustomUserDetails;
import com.giapha.service.FamilyMemberService;
import com.giapha.util.AuthorizationHelper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Endpoints for managing family members + invitations.
 *
 * <pre>
 *  GET    /api/families/{familyId}/members              — list (with filters)
 *  POST   /api/families/{familyId}/members              — add
 *  POST   /api/families/{familyId}/invitations          — create invite (ADMIN)
 *  GET    /api/families/{familyId}/invitations          — list invite history
 *  DELETE /api/invitations/{invitationId}               — revoke (ADMIN)
 *  GET    /api/members/{memberId}                       — detail
 *  PUT    /api/members/{memberId}                       — update
 *  DELETE /api/members/{memberId}                       — delete
 * </pre>
 */
@RestController
@RequiredArgsConstructor
public class FamilyMemberController {

    private final FamilyMemberService memberService;
    private final AuthorizationHelper authHelper;

    @GetMapping("/families/{familyId}/members")
    public ResponseEntity<Map<String, Object>> listMembers(
            @PathVariable UUID familyId,
            @RequestParam(value = "generationId", required = false) UUID generationId,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "aliveOnly", required = false) Boolean aliveOnly,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        authHelper.requireFamilyMember(currentUser.getId(), familyId);
        List<MemberWithRelationships> data =
                memberService.listMembers(familyId, generationId, search, aliveOnly, currentUser.getUser());
        return ResponseEntity.ok(Map.of("members", data));
    }

    @PostMapping("/families/{familyId}/members")
    public ResponseEntity<Map<String, Object>> addMember(
            @PathVariable UUID familyId,
            @Valid @RequestBody CreateMemberRequest req,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        authHelper.requireFamilyMember(currentUser.getId(), familyId);
        MemberDto member = memberService.addMember(familyId, req, currentUser.getUser());
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("member", member));
    }

    @PostMapping("/families/{familyId}/invitations")
    public ResponseEntity<Map<String, Object>> createInvitation(
            @PathVariable UUID familyId,
            @Valid @RequestBody CreateInvitationRequest req,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        authHelper.requireFamilyMember(currentUser.getId(), familyId);
        InvitationResponse inv = memberService.createInvitation(familyId, req, currentUser.getUser());
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("invitation", inv));
    }

    @GetMapping("/families/{familyId}/invitations")
    public ResponseEntity<Map<String, Object>> listInvitations(
            @PathVariable UUID familyId,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        authHelper.requireFamilyMember(currentUser.getId(), familyId);
        List<InvitationDetailDto> data =
                memberService.listInvitations(familyId, currentUser.getUser());
        return ResponseEntity.ok(Map.of("invitations", data));
    }

    @DeleteMapping("/invitations/{invitationId}")
    public ResponseEntity<MessageResponse> revokeInvitation(
            @PathVariable UUID invitationId,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        return ResponseEntity.ok(
                memberService.revokeInvitation(invitationId, currentUser.getUser()));
    }

    @GetMapping("/members/{memberId}")
    public ResponseEntity<MemberWithRelationships> getMember(
            @PathVariable UUID memberId,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        UUID familyId = authHelper.familyIdOfMember(memberId);
        authHelper.requireFamilyMember(currentUser.getId(), familyId);
        return ResponseEntity.ok(memberService.getMember(memberId, currentUser.getUser()));
    }

    @PutMapping("/members/{memberId}")
    public ResponseEntity<Map<String, Object>> updateMember(
            @PathVariable UUID memberId,
            @Valid @RequestBody UpdateMemberRequest req,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        UUID familyId = authHelper.familyIdOfMember(memberId);
        authHelper.requireFamilyMember(currentUser.getId(), familyId);
        MemberDto m = memberService.updateMember(memberId, req, currentUser.getUser());
        return ResponseEntity.ok(Map.of("member", m));
    }

    @PutMapping("/families/{familyId}/members/{memberId}/role")
    public ResponseEntity<Map<String, Object>> updateMemberRole(
            @PathVariable UUID familyId,
            @PathVariable UUID memberId,
            @Valid @RequestBody UpdateMemberRoleRequest req,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        authHelper.requireFamilyMember(currentUser.getId(), familyId);
        MemberDto m = memberService.updateMemberRole(familyId, memberId,
                req.getRole(), currentUser.getUser());
        return ResponseEntity.ok(Map.of("member", m, "role", req.getRole()));
    }

    @GetMapping("/families/{familyId}/members/{memberId}/role")
    public ResponseEntity<Map<String, Object>> getMemberRole(
            @PathVariable UUID familyId,
            @PathVariable UUID memberId,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        authHelper.requireFamilyMember(currentUser.getId(), familyId);
        String role = memberService.resolveMemberRole(familyId, memberId, currentUser.getUser());
        // Collections.singletonMap (not Map.of) because Map.of(K,V) rejects null values
        // via Objects.requireNonNull, and a "pure genealogy entry" member has no
        // linked user account — so role legitimately resolves to null here.
        return ResponseEntity.ok(Collections.singletonMap("role", role));
    }

    @DeleteMapping("/members/{memberId}")
    public ResponseEntity<MessageResponse> deleteMember(
            @PathVariable UUID memberId,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        UUID familyId = authHelper.familyIdOfMember(memberId);
        authHelper.requireFamilyMember(currentUser.getId(), familyId);
        return ResponseEntity.ok(memberService.deleteMember(memberId, currentUser.getUser()));
    }
}
