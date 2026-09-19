package com.giapha.service;

import com.giapha.exception.BadRequestException;
import com.giapha.exception.ForbiddenException;
import com.giapha.exception.ResourceNotFoundException;
import com.giapha.model.dto.common.MessageResponse;
import com.giapha.model.dto.relationship.CreateRelationshipRequest;
import com.giapha.model.dto.relationship.RelationshipDto;
import com.giapha.model.dto.relationship.UpdateRelationshipRequest;
import com.giapha.model.entity.Family;
import com.giapha.model.entity.FamilyMember;
import com.giapha.model.entity.Relationship;
import com.giapha.model.entity.RelationshipType;
import com.giapha.model.entity.User;
import com.giapha.repository.FamilyMemberRepository;
import com.giapha.repository.FamilyRepository;
import com.giapha.repository.RelationshipRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * CRUD for relationships with auto-reciprocal handling for PARENT↔CHILD pairs.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RelationshipService {

    private final RelationshipRepository relationshipRepository;
    private final FamilyMemberRepository memberRepository;
    private final FamilyRepository familyRepository;
    private final FamilyRoleResolver roleResolver;

    /**
     * List every relationship edge in a family. Authorizes by membership:
     * non-members get a 403, family members see the full set. The repository
     * already returns {@code Relationship} rows ordered by id ascending; the
     * tree view at {@code GET /families/{id}/tree} re-computes its own nested
     * shape, but this flat listing is what {@code useFamilyRelationships} (and
     * any future graph editor) consumes.
     */
    @Transactional(readOnly = true)
    public List<Relationship> list(UUID familyId, User user) {
        if (roleResolver.resolveRole(familyId, user) == null) {
            throw new ForbiddenException("Bạn không phải thành viên của gia tộc này");
        }
        return relationshipRepository.findAllForFamily(familyId);
    }

    @Transactional
    public RelationshipDto create(CreateRelationshipRequest req, User user) {
        if (req.getFromMemberId().equals(req.getToMemberId())) {
            throw new BadRequestException("Không thể tạo quan hệ với chính mình");
        }
        Family f = familyRepository.findById(req.getFamilyId())
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy gia tộc"));

        String role = roleResolver.resolveRole(req.getFamilyId(), user);
        if (role == null) {
            throw new ForbiddenException("Bạn không phải thành viên của gia tộc này");
        }
        if (!(FamilyRoleResolver.ADMIN.equals(role)
                || FamilyRoleResolver.EDITOR.equals(role)
                || FamilyRoleResolver.MEMBER.equals(role))) {
            throw new ForbiddenException("Bạn không có quyền tạo quan hệ");
        }

        FamilyMember from = memberRepository.findById(req.getFromMemberId())
            .orElseThrow(() -> new ResourceNotFoundException("Thành viên nguồn không tồn tại"));
        FamilyMember to = memberRepository.findById(req.getToMemberId())
            .orElseThrow(() -> new ResourceNotFoundException("Thành viên đích không tồn tại"));
        if (!from.getFamilyId().equals(req.getFamilyId())
                || !to.getFamilyId().equals(req.getFamilyId())) {
            throw new BadRequestException("Cả hai thành viên phải thuộc cùng gia tộc");
        }

        RelationshipType type = RelationshipType.parse(req.getRelationshipType());

        // For SPOUSE, validate not already married.
        if (type == RelationshipType.SPOUSE && relationshipRepository.existsSpouseLinkFor(from.getId())) {
            throw new BadRequestException("Thành viên đã có quan hệ vợ/chồng hiện tại");
        }
        if (type == RelationshipType.SPOUSE && relationshipRepository.existsSpouseLinkFor(to.getId())) {
            throw new BadRequestException("Đối phương đã có quan hệ vợ/chồng hiện tại");
        }

        Relationship r = Relationship.builder()
            .familyId(req.getFamilyId())
            .fromMemberId(req.getFromMemberId())
            .toMemberId(req.getToMemberId())
            .type(type)
            .startDate(req.getStartDate())
            .notes(req.getNotes())
            .build();
        Relationship saved = relationshipRepository.insert(r);

        // Auto-create reciprocal for PARENT↔CHILD if not already present.
        if (type == RelationshipType.PARENT || type == RelationshipType.CHILD) {
            var reciprocal = relationshipRepository.findReciprocal(
                req.getFamilyId(), req.getFromMemberId(), req.getToMemberId(), type);
            if (reciprocal.isEmpty()) {
                Relationship back = Relationship.builder()
                    .familyId(req.getFamilyId())
                    .fromMemberId(req.getToMemberId())
                    .toMemberId(req.getFromMemberId())
                    .type(type.reciprocal())
                    .startDate(req.getStartDate())
                    .notes(null)
                    .build();
                relationshipRepository.insert(back);
            }
        }

        log.info("Relationship {} ({} -> {}) created in family {}",
            saved.getId(), req.getFromMemberId(), req.getToMemberId(), req.getFamilyId());
        return RelationshipDto.from(saved);
    }

    @Transactional
    public RelationshipDto update(UUID relationshipId, UpdateRelationshipRequest req, User user) {
        Relationship existing = relationshipRepository.findById(relationshipId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy quan hệ"));
        if (!roleResolver.isCreator(existing.getFamilyId(), user.getId())) {
            throw new ForbiddenException("Chỉ quản trị viên mới có thể chỉnh sửa quan hệ");
        }
        relationshipRepository.updateEndDateAndNotes(relationshipId, req.getEndDate(), req.getNotes());
        Relationship r = relationshipRepository.findById(relationshipId).orElseThrow();
        log.info("Relationship {} updated by user {}", relationshipId, user.getId());
        return RelationshipDto.from(r);
    }

    @Transactional
    public MessageResponse delete(UUID relationshipId, User user) {
        Relationship existing = relationshipRepository.findById(relationshipId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy quan hệ"));
        if (!roleResolver.isCreator(existing.getFamilyId(), user.getId())) {
            throw new ForbiddenException("Chỉ quản trị viên mới có thể xoá quan hệ");
        }

        // For PARENT/CHILD also delete the reciprocal row in the same family.
        if (existing.getType() == RelationshipType.PARENT
                || existing.getType() == RelationshipType.CHILD) {
            relationshipRepository.deletePair(
                existing.getFamilyId(),
                existing.getFromMemberId(),
                existing.getToMemberId(),
                existing.getType().name());
        } else {
            relationshipRepository.hardDeleteById(relationshipId);
        }
        log.info("Relationship {} deleted by user {}", relationshipId, user.getId());
        return MessageResponse.builder().message("Đã xoá quan hệ").build();
    }
}
