package com.giapha.service;

import com.giapha.exception.BadRequestException;
import com.giapha.exception.ForbiddenException;
import com.giapha.exception.ResourceNotFoundException;
import com.giapha.model.dto.common.MessageResponse;
import com.giapha.model.dto.family.CreateInvitationRequest;
import com.giapha.model.dto.family.InvitationDetailDto;
import com.giapha.model.dto.family.InvitationResponse;
import com.giapha.model.dto.member.CreateMemberRequest;
import com.giapha.model.dto.member.MemberDto;
import com.giapha.model.dto.member.MemberSummary;
import com.giapha.model.dto.member.MemberWithRelationships;
import com.giapha.model.dto.member.UpdateMemberRequest;
import com.giapha.model.entity.Family;
import com.giapha.model.entity.FamilyInvitation;
import com.giapha.model.entity.FamilyMember;
import com.giapha.model.entity.FamilyRole;
import com.giapha.model.entity.Gender;
import com.giapha.model.entity.Generation;
import com.giapha.model.entity.Relationship;
import com.giapha.model.entity.RelationshipType;
import com.giapha.model.entity.User;
import com.giapha.repository.FamilyInvitationRepository;
import com.giapha.repository.FamilyMemberRepository;
import com.giapha.repository.FamilyRepository;
import com.giapha.repository.GenerationRepository;
import com.giapha.repository.RelationshipRepository;
import com.giapha.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * CRUD for family_members plus invitation creation.
 *
 * <p>Authorization model:</p>
 * <ul>
 *   <li>Read access — any resolved family member (any role).</li>
 *   <li>Write access (add/update member, create invitation) — ADMIN, EDITOR, or
 *       generic MEMBER-link user (covers the family creator's seed links).</li>
 *   <li>Delete member — ADMIN only.</li>
 *   <li>Create invitation — ADMIN only (matches the spec).</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FamilyMemberService {

    private final FamilyMemberRepository memberRepository;
    private final RelationshipRepository relationshipRepository;
    private final GenerationRepository generationRepository;
    private final FamilyRepository familyRepository;
    private final FamilyInvitationRepository invitationRepository;
    private final FamilyRoleResolver roleResolver;
    private final UserRepository userRepository;

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final char[] ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789".toCharArray();

    // ------------------------------------------------------------------ //
    // READ
    // ------------------------------------------------------------------ //

    public List<MemberWithRelationships> listMembers(UUID familyId,
                                                     UUID generationId,
                                                     String search,
                                                     Boolean aliveOnly,
                                                     User user) {
        Family f = familyRepository.findById(familyId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy gia tộc"));
        String role = roleResolver.resolveRole(familyId, user);
        if (role == null) {
            throw new ForbiddenException("Bạn không phải thành viên của gia tộc này");
        }

        List<FamilyMember> members = memberRepository.search(familyId, generationId, search, aliveOnly);

        // Pre-load generations for member-to-generation projection.
        Map<UUID, Generation> generations = new HashMap<>();
        for (Generation g : generationRepository.findByFamily(familyId)) {
            generations.put(g.getId(), g);
        }

        // Pre-load all relationships in the family once (avoid N+1 on the hot path).
        Map<UUID, List<Relationship>> outgoing = new HashMap<>();
        Map<UUID, List<Relationship>> incoming = new HashMap<>();
        for (Relationship r : relationshipRepository.findAllForFamily(familyId)) {
            outgoing.computeIfAbsent(r.getFromMemberId(), k -> new ArrayList<>()).add(r);
            incoming.computeIfAbsent(r.getToMemberId(), k -> new ArrayList<>()).add(r);
        }

        Map<UUID, FamilyMember> memberIndex = new HashMap<>();
        for (FamilyMember m : members) memberIndex.put(m.getId(), m);

        return members.stream().map(m -> buildWithRelationships(
            m, generations, outgoing, incoming, memberIndex)).toList();
    }

    public MemberWithRelationships getMember(UUID memberId, User user) {
        FamilyMember m = memberRepository.findById(memberId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thành viên"));
        String role = roleResolver.resolveRole(m.getFamilyId(), user);
        if (role == null) {
            throw new ForbiddenException("Bạn không có quyền truy cập thành viên này");
        }
        // Need the full member set for this family to resolve every relationship target.
        List<FamilyMember> familyMembers = memberRepository.findByFamily(m.getFamilyId());
        Map<UUID, FamilyMember> memberIndex = new HashMap<>();
        for (FamilyMember fm : familyMembers) memberIndex.put(fm.getId(), fm);

        Map<UUID, Generation> generations = new HashMap<>();
        for (Generation g : generationRepository.findByFamily(m.getFamilyId())) {
            generations.put(g.getId(), g);
        }

        Map<UUID, List<Relationship>> outgoing = new HashMap<>();
        Map<UUID, List<Relationship>> incoming = new HashMap<>();
        for (Relationship r : relationshipRepository.findAllForFamily(m.getFamilyId())) {
            outgoing.computeIfAbsent(r.getFromMemberId(), k -> new ArrayList<>()).add(r);
            incoming.computeIfAbsent(r.getToMemberId(), k -> new ArrayList<>()).add(r);
        }

        return buildWithRelationships(m, generations, outgoing, incoming, memberIndex);
    }

    private MemberWithRelationships buildWithRelationships(
            FamilyMember m,
            Map<UUID, Generation> generations,
            Map<UUID, List<Relationship>> outgoing,
            Map<UUID, List<Relationship>> incoming,
            Map<UUID, FamilyMember> memberIndex) {

        MemberDto memberDto = MemberDto.from(m);
        Generation gen = m.getGenerationId() != null ? generations.get(m.getGenerationId()) : null;
        MemberSummary genSummary = gen == null ? null : MemberSummary.builder()
            .id(gen.getId())
            .fullName(gen.getName())
            .build();

        List<MemberSummary> parents = new ArrayList<>();
        List<MemberSummary> children = new ArrayList<>();
        List<MemberSummary> spouses = new ArrayList<>();
        List<MemberSummary> siblings = new ArrayList<>();

        // Edge semantics: a row "from → to" with type X means "from is X of to".
        //   Outgoing (self is from): "self is X of target".
        //     PARENT/ADOPTED/GODPARENT  → target is self's child   → children
        //     CHILD                     → target is self's parent  → parents
        //     SPOUSE/SIBLING            → symmetric
        //   Incoming (self is to): "source is X of self".
        //     PARENT/ADOPTED/GODPARENT  → source is self's parent  → parents
        //     CHILD                     → source is self's child   → children
        //     SPOUSE/SIBLING            → symmetric
        java.util.Set<UUID> seenParents = new java.util.LinkedHashSet<>();
        java.util.Set<UUID> seenChildren = new java.util.LinkedHashSet<>();
        java.util.Set<UUID> seenSpouses = new java.util.LinkedHashSet<>();
        java.util.Set<UUID> seenSiblings = new java.util.LinkedHashSet<>();

        // outgoing (this member -> others)
        if (outgoing.containsKey(m.getId())) {
            for (Relationship r : outgoing.get(m.getId())) {
                FamilyMember target = memberIndex.get(r.getToMemberId());
                if (target == null) continue;
                MemberSummary s = toSummary(target);
                switch (r.getType()) {
                    case PARENT, ADOPTED, GODPARENT -> { if (seenChildren.add(target.getId())) children.add(s); }
                    case CHILD -> { if (seenParents.add(target.getId())) parents.add(s); }
                    case SPOUSE -> { if (seenSpouses.add(target.getId())) spouses.add(s); }
                    case SIBLING -> { if (seenSiblings.add(target.getId())) siblings.add(s); }
                }
            }
        }
        // incoming (others -> this member)
        if (incoming.containsKey(m.getId())) {
            for (Relationship r : incoming.get(m.getId())) {
                FamilyMember source = memberIndex.get(r.getFromMemberId());
                if (source == null) continue;
                MemberSummary s = toSummary(source);
                switch (r.getType()) {
                    case CHILD -> { if (seenChildren.add(source.getId())) children.add(s); }
                    case PARENT, ADOPTED, GODPARENT -> { if (seenParents.add(source.getId())) parents.add(s); }
                    case SPOUSE -> { if (seenSpouses.add(source.getId())) spouses.add(s); }
                    case SIBLING -> { if (seenSiblings.add(source.getId())) siblings.add(s); }
                    default -> { /* ignore */ }
                }
            }
        }

        return MemberWithRelationships.builder()
            .member(memberDto)
            .generation(genSummary)
            .parents(parents)
            .children(children)
            .spouses(spouses)
            .siblings(siblings)
            .build();
    }

    private MemberSummary toSummary(FamilyMember m) {
        return MemberSummary.builder()
            .id(m.getId())
            .fullName(m.getFullName())
            .nickname(m.getNickname())
            .gender(m.getGender() == null ? null : m.getGender().name())
            .birthDate(m.getBirthDate())
            .deathDate(m.getDeathDate())
            .isAlive(Boolean.TRUE.equals(m.getIsAlive()))
            .generationId(m.getGenerationId())
            .avatarUrl(m.getAvatarUrl())
            .build();
    }

    // ------------------------------------------------------------------ //
    // WRITE
    // ------------------------------------------------------------------ //

    @Transactional
    public MemberDto addMember(UUID familyId, CreateMemberRequest req, User user) {
        Family f = familyRepository.findById(familyId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy gia tộc"));
        String role = roleResolver.resolveRole(familyId, user);
        if (role == null) {
            throw new ForbiddenException("Bạn không phải thành viên của gia tộc này");
        }
        if (!(FamilyRoleResolver.ADMIN.equals(role)
                || FamilyRoleResolver.EDITOR.equals(role)
                || FamilyRoleResolver.MEMBER.equals(role))) {
            throw new ForbiddenException("Bạn không có quyền thêm thành viên");
        }

        if (req.getFullName() == null || req.getFullName().isBlank()) {
            throw new BadRequestException("Họ tên là bắt buộc");
        }
        if (req.getGenerationId() == null) {
            throw new BadRequestException("generationId là bắt buộc");
        }
        // Validate generation belongs to the family.
        Generation gen = generationRepository.findById(req.getGenerationId())
            .orElseThrow(() -> new BadRequestException("Thế hệ không tồn tại"));
        if (!gen.getFamilyId().equals(familyId)) {
            throw new BadRequestException("Thế hệ không thuộc gia tộc này");
        }

        FamilyMember m = FamilyMember.builder()
            .familyId(familyId)
            .userId(req.getUserId())
            .fullName(req.getFullName())
            .nickname(req.getNickname())
            .gender(parseGender(req.getGender()))
            .birthDate(req.getBirthDate())
            .deathDate(req.getDeathDate())
            .birthPlace(req.getBirthPlace())
            .currentLocation(req.getCurrentLocation())
            .occupation(req.getOccupation())
            .biography(req.getBiography())
            .generationId(req.getGenerationId())
            .isAlive(req.getIsAlive() == null ? Boolean.TRUE : req.getIsAlive())
            .build();
        FamilyMember saved = memberRepository.insert(m);
        familyRepository.incrementMemberCount(familyId, 1);
        log.info("Member {} added to family {} by user {}", saved.getId(), familyId, user.getId());
        return MemberDto.from(saved);
    }

    @Transactional
    public MemberDto updateMember(UUID memberId, UpdateMemberRequest req, User user) {
        FamilyMember existing = memberRepository.findById(memberId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thành viên"));
        String role = roleResolver.resolveRole(existing.getFamilyId(), user);
        if (role == null) {
            throw new ForbiddenException("Bạn không phải thành viên của gia tộc này");
        }
        if (!(FamilyRoleResolver.ADMIN.equals(role)
                || FamilyRoleResolver.EDITOR.equals(role)
                || FamilyRoleResolver.MEMBER.equals(role))) {
            throw new ForbiddenException("Bạn không có quyền chỉnh sửa thành viên");
        }

        if (req.getGenerationId() != null) {
            Generation gen = generationRepository.findById(req.getGenerationId())
                .orElseThrow(() -> new BadRequestException("Thế hệ không tồn tại"));
            if (!gen.getFamilyId().equals(existing.getFamilyId())) {
                throw new BadRequestException("Thế hệ không thuộc gia tộc này");
            }
        }

        memberRepository.updateFields(memberId,
            req.getFullName(), req.getNickname(), req.getAvatarUrl(),
            req.getGender(),
            req.getBirthDate(), req.getDeathDate(),
            req.getBirthPlace(), req.getCurrentLocation(),
            req.getOccupation(), req.getBiography(),
            req.getGenerationId(), req.getUserId(),
            req.getIsAlive());
        FamilyMember updated = memberRepository.findById(memberId).orElseThrow();
        return MemberDto.from(updated);
    }

    @Transactional
    public MessageResponse deleteMember(UUID memberId, User user) {
        FamilyMember existing = memberRepository.findById(memberId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thành viên"));
        if (!roleResolver.isCreator(existing.getFamilyId(), user.getId())) {
            throw new ForbiddenException("Chỉ quản trị viên mới có thể xoá thành viên");
        }

        int relCount = memberRepository.countRelationshipsFor(memberId);
        if (relCount > 0) {
            memberRepository.softDelete(memberId);
            log.info("Member {} soft-deleted (had {} relationships)", memberId, relCount);
            return MessageResponse.builder()
                .message("Đã đánh dấu thành viên là đã mất (giữ lại các quan hệ)")
                .build();
        }
        memberRepository.hardDelete(memberId);
        familyRepository.incrementMemberCount(existing.getFamilyId(), -1);
        log.info("Member {} hard-deleted by user {}", memberId, user.getId());
        return MessageResponse.builder()
            .message("Đã xoá thành viên")
            .build();
    }

    // ------------------------------------------------------------------ //
    // Invitations
    // ------------------------------------------------------------------ //

    @Transactional
    public InvitationResponse createInvitation(UUID familyId, CreateInvitationRequest req, User user) {
        Family f = familyRepository.findById(familyId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy gia tộc"));
        if (!roleResolver.isCreator(familyId, user.getId())) {
            throw new ForbiddenException("Chỉ quản trị viên mới có thể tạo lời mời");
        }

        FamilyRole role = roleResolver.parseRoleOrDefault(req.getRole());

        String code;
        int attempts = 0;
        do {
            code = generateInviteCode();
            attempts++;
            if (attempts > 10) {
                throw new IllegalStateException("Could not generate a unique invite code after 10 attempts");
            }
        } while (invitationRepository.existsByInviteCode(code));

        FamilyInvitation inv = FamilyInvitation.builder()
            .familyId(familyId)
            .inviterId(user.getId())
            .inviteeEmail(req.getInviteeEmail().trim().toLowerCase())
            .inviteCode(code)
            .role(role)
            .expiresAt(OffsetDateTime.now(ZoneOffset.UTC).plusDays(7))
            .build();
        FamilyInvitation saved = invitationRepository.insert(inv);
        log.info("Invitation {} created by user {} for family {}", saved.getId(), user.getId(), familyId);

        return InvitationResponse.builder()
            .id(saved.getId())
            .familyId(familyId)
            .inviteeEmail(saved.getInviteeEmail())
            .role(role.name())
            .inviteCode(code)
            .inviteUrl("https://caygiaphaso.vn/join/" + code)
            .expiresAt(saved.getExpiresAt())
            .acceptedAt(null)
            .createdAt(saved.getCreatedAt())
            .build();
    }

    /** List every invitation ever issued for this family, newest first. */
    public List<InvitationDetailDto> listInvitations(UUID familyId, User user) {
        if (roleResolver.resolveRole(familyId, user) == null) {
            throw new ForbiddenException("Bạn không có quyền xem lời mời của gia tộc này");
        }
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        return invitationRepository.findByFamilyId(familyId).stream()
            .map(inv -> toDetail(inv, now))
            .toList();
    }

    /** Mark an invitation as revoked (ADMIN-only). */
    public MessageResponse revokeInvitation(UUID invitationId, User user) {
        FamilyInvitation inv = invitationRepository.findById(invitationId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy lời mời"));
        if (!roleResolver.isCreator(inv.getFamilyId(), user.getId())) {
            throw new ForbiddenException("Chỉ quản trị viên mới có thể thu hồi lời mời");
        }
        if (inv.getAcceptedAt() != null) {
            throw new BadRequestException("Lời mời đã được chấp nhận, không thể thu hồi");
        }
        invitationRepository.revoke(invitationId);
        log.info("Invitation {} revoked by user {}", invitationId, user.getId());
        return MessageResponse.builder().message("Đã thu hồi lời mời").build();
    }

    private InvitationDetailDto toDetail(FamilyInvitation inv, OffsetDateTime now) {
        String status;
        if (inv.getAcceptedAt() != null) {
            status = "ACCEPTED";
        } else if (inv.getExpiresAt() != null && inv.getExpiresAt().isBefore(now)) {
            status = "EXPIRED";
        } else {
            status = "PENDING";
        }

        String inviterName = userRepository.findById(inv.getInviterId())
            .map(User::getFullName).orElse(null);

        // If the invitation has been accepted, the invitee is now a family member —
        // look them up by email so we can show their display name.
        String inviteeName = null;
        if (inv.getAcceptedAt() != null) {
            inviteeName = memberRepository
                .findByFamily(inv.getFamilyId()).stream()
                .filter(m -> inv.getInviteeEmail().equalsIgnoreCase(
                    userRepository.findById(m.getUserId()).map(User::getEmail).orElse("")))
                .map(FamilyMember::getFullName)
                .findFirst().orElse(null);
        }

        return InvitationDetailDto.builder()
            .id(inv.getId())
            .familyId(inv.getFamilyId())
            .inviterId(inv.getInviterId())
            .inviterName(inviterName)
            .inviteeEmail(inv.getInviteeEmail())
            .inviteeName(inviteeName)
            .inviteCode(inv.getInviteCode())
            .inviteUrl("https://caygiaphaso.vn/join/" + inv.getInviteCode())
            .role(inv.getRole() != null ? inv.getRole().name() : null)
            .status(status)
            .expiresAt(inv.getExpiresAt())
            .acceptedAt(inv.getAcceptedAt())
            .createdAt(inv.getCreatedAt())
            .build();
    }

    private static String generateInviteCode() {
        StringBuilder sb = new StringBuilder(8);
        for (int i = 0; i < 8; i++) {
            sb.append(ALPHABET[RANDOM.nextInt(ALPHABET.length)]);
        }
        return sb.toString();
    }

    private Gender parseGender(String raw) {
        try { return Gender.parse(raw); } catch (Exception e) { return null; }
    }
}
