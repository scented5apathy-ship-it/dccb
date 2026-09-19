package com.giapha.service;

import com.giapha.exception.BadRequestException;
import com.giapha.exception.ForbiddenException;
import com.giapha.exception.ResourceNotFoundException;
import com.giapha.model.dto.family.CreateFamilyRequest;
import com.giapha.model.dto.family.FamilyDetailDto;
import com.giapha.model.dto.family.FamilyDto;
import com.giapha.model.dto.family.FamilyStats;
import com.giapha.model.dto.family.FamilyWithRoleDto;
import com.giapha.model.dto.family.JoinFamilyRequest;
import com.giapha.model.dto.family.UpdateFamilyRequest;
import com.giapha.model.dto.generation.GenerationDto;
import com.giapha.model.dto.heritage.HeritageDto;
import com.giapha.model.entity.Family;
import com.giapha.model.entity.FamilyHeritage;
import com.giapha.model.entity.FamilyInvitation;
import com.giapha.model.entity.FamilyMember;
import com.giapha.model.entity.FamilyRole;
import com.giapha.model.entity.Generation;
import com.giapha.model.entity.User;
import com.giapha.repository.FamilyInvitationRepository;
import com.giapha.repository.FamilyMemberRepository;
import com.giapha.repository.FamilyRepository;
import com.giapha.repository.GenerationRepository;
import com.giapha.repository.HeritageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

/**
 * Orchestrates family CRUD, join-via-invite-code, and family-level stats.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class FamilyService {

    private final FamilyRepository familyRepository;
    private final GenerationRepository generationRepository;
    private final FamilyMemberRepository familyMemberRepository;
    private final HeritageRepository heritageRepository;
    private final FamilyInvitationRepository invitationRepository;
    private final FamilyRoleResolver roleResolver;

    // ------------------------------------------------------------------ //
    // Create / list / get / update
    // ------------------------------------------------------------------ //

    @Transactional
    public FamilyDto createFamily(CreateFamilyRequest req, User creator) {
        Family f = Family.builder()
            .name(req.getName())
            .description(req.getDescription())
            .foundedYear(req.getFoundedYear())
            .motto(req.getMotto())
            .originLocation(req.getOriginLocation())
            .createdBy(creator.getId())
            .memberCount(0)
            .build();
        Family saved = familyRepository.insert(f);

        // Auto-create Generation 1.
        Generation g1 = Generation.builder()
            .familyId(saved.getId())
            .generationNumber(1)
            .name("Đời 1")
            .description("Thế hệ đầu tiên được tạo tự động khi lập gia tộc.")
            .build();
        generationRepository.insert(g1);

        // Auto-add the creator as a family member with the highest role (ADMIN).
        // The creator already has ADMIN via `families.created_by`, but we also link
        // them through `family_members.user_id` so they:
        //   - appear in the members list,
        //   - pass `isMember(familyId, userId)` checks used by chat, events, time capsules,
        //   - get accurate `stats.memberCount`.
        FamilyMember creatorMember = FamilyMember.builder()
            .familyId(saved.getId())
            .userId(creator.getId())
            .fullName(creator.getFullName())
            .generationId(g1.getId())
            .isAlive(true)
            .build();
        familyMemberRepository.insert(creatorMember);

        // Bump member_count to reflect the auto-added creator.
        saved.setMemberCount(1);
        familyRepository.incrementMemberCount(saved.getId(), 1);

        log.info("Family {} created by user {} (creator auto-added as ADMIN member)",
                saved.getId(), creator.getId());
        return FamilyDto.from(saved);
    }

    public List<FamilyWithRoleDto> listFamiliesForUser(User user) {
        List<Family> families = familyRepository.findFamiliesForUser(user.getId());
        return families.stream().map(f -> {
            String role = roleResolver.resolveRole(f.getId(), user);
            return FamilyWithRoleDto.builder()
                .family(FamilyDto.from(f))
                .role(role)
                .memberCount(f.getMemberCount())
                .isCreator(roleResolver.isCreator(f.getId(), user.getId()))
                .build();
        }).toList();
    }

    public FamilyDetailDto getFamilyDetail(UUID familyId, User user) {
        Family family = familyRepository.findById(familyId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy gia tộc"));
        String role = roleResolver.resolveRole(familyId, user);
        if (role == null) {
            throw new ForbiddenException("Bạn không phải thành viên của gia tộc này");
        }

        List<Generation> generations = generationRepository.findByFamily(familyId);
        List<FamilyHeritage> heritages = heritageRepository.findByFamily(familyId);

        FamilyStats stats = FamilyStats.builder()
            .memberCount(family.getMemberCount())
            .generationCount(familyRepository.countGenerations(familyId))
            .recipeCount(familyRepository.countRecipes(familyId))
            .storyCount(familyRepository.countStories(familyId))
            .eventCount(familyRepository.countEvents(familyId))
            .heritageCount(heritages.size())
            .build();

        return FamilyDetailDto.builder()
            .family(FamilyDto.from(family))
            .role(role)
            .generations(generations.stream().map(GenerationDto::from).toList())
            .heritages(heritages.stream().map(HeritageDto::fromEntity).toList())
            .stats(stats)
            .build();
    }

    @Transactional
    public FamilyDto updateFamily(UUID familyId, UpdateFamilyRequest req, User user) {
        Family existing = familyRepository.findById(familyId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy gia tộc"));
        if (!roleResolver.isCreator(familyId, user.getId())) {
            throw new ForbiddenException("Chỉ quản trị viên mới có thể chỉnh sửa gia tộc");
        }
        familyRepository.updateBasics(familyId,
            req.getName(), req.getDescription(), req.getMotto(),
            req.getOriginLocation(), req.getLogoUrl(), req.getCoverImageUrl());
        Family updated = familyRepository.findById(familyId).orElseThrow();
        log.info("Family {} updated by user {}", familyId, user.getId());
        return FamilyDto.from(updated);
    }

    // ------------------------------------------------------------------ //
    // Join via invitation code
    // ------------------------------------------------------------------ //

    @Transactional
    public FamilyWithRoleDto joinFamily(JoinFamilyRequest req, User user) {
        FamilyInvitation inv = invitationRepository.findByInviteCode(req.getInviteCode())
            .orElseThrow(() -> new ResourceNotFoundException("Mã mời không tồn tại"));

        if (inv.getAcceptedAt() != null) {
            throw new BadRequestException("Mã mời đã được sử dụng");
        }
        if (inv.getExpiresAt() != null && inv.getExpiresAt().isBefore(OffsetDateTime.now(ZoneOffset.UTC))) {
            throw new BadRequestException("Mã mời đã hết hạn");
        }
        // Optional sanity-check — if the invitation was for a specific email,
        // require the joining user's email to match (case-insensitive).
        if (inv.getInviteeEmail() != null
                && user.getEmail() != null
                && !user.getEmail().equalsIgnoreCase(inv.getInviteeEmail())) {
            throw new BadRequestException("Mã mời không phải của bạn");
        }

        // Mark invitation accepted.
        invitationRepository.markAccepted(inv.getId());

        // Add the user to family_members if no row exists for them yet.
        Family family = familyRepository.findById(inv.getFamilyId())
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy gia tộc"));

        var existingMember = familyMemberRepository.findByUserAndFamily(user.getId(), family.getId());
        if (existingMember.isEmpty()) {
            // Resolve the generation this new joiner belongs to.
            // Strategy: pick the *highest* existing generation (the youngest one).
            // If for some reason there are no generations yet, fall back to creating
            // generation #1 so the member is never orphaned from the family tree.
            var generations = generationRepository.findByFamily(family.getId());
            UUID generationId = generations.stream()
                .max(Comparator.comparingInt(Generation::getGenerationNumber))
                .map(Generation::getId)
                .orElseGet(() -> {
                    Generation g1 = Generation.builder()
                        .familyId(family.getId())
                        .generationNumber(1)
                        .name("Đời 1")
                        .description("Đời mặc định được tạo khi thành viên gia nhập.")
                        .build();
                    return generationRepository.insert(g1).getId();
                });

            FamilyMember newMember = FamilyMember.builder()
                .familyId(family.getId())
                .userId(user.getId())
                .fullName(user.getFullName())
                .generationId(generationId)
                .isAlive(Boolean.TRUE)
                .build();
            FamilyMember saved = familyMemberRepository.insert(newMember);
            familyRepository.incrementMemberCount(family.getId(), 1);
        }

        String role = roleResolver.resolveRole(family.getId(), user);
        return FamilyWithRoleDto.builder()
            .family(FamilyDto.from(family))
            .role(role == null ? (inv.getRole() == null ? FamilyRoleResolver.VIEWER : inv.getRole().name()) : role)
            .memberCount(family.getMemberCount())
            .isCreator(false)
            .build();
    }

    public User requireUser(com.giapha.security.CustomUserDetails cud) {
        return cud.getUser();
    }
}
