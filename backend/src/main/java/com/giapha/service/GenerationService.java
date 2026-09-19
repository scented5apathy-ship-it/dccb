package com.giapha.service;

import com.giapha.exception.BadRequestException;
import com.giapha.exception.ForbiddenException;
import com.giapha.exception.ResourceNotFoundException;
import com.giapha.model.dto.common.MessageResponse;
import com.giapha.model.dto.generation.CreateGenerationRequest;
import com.giapha.model.dto.generation.GenerationDto;
import com.giapha.model.entity.Family;
import com.giapha.model.entity.Generation;
import com.giapha.model.entity.User;
import com.giapha.repository.FamilyRepository;
import com.giapha.repository.GenerationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * CRUD for {@link Generation}, with role-gated writes.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class GenerationService {

    private final GenerationRepository generationRepository;
    private final FamilyRepository familyRepository;
    private final FamilyRoleResolver roleResolver;

    public List<GenerationDto> list(UUID familyId, User user) {
        Family f = familyRepository.findById(familyId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy gia tộc"));
        if (roleResolver.resolveRole(familyId, user) == null) {
            throw new ForbiddenException("Bạn không phải thành viên của gia tộc này");
        }
        return generationRepository.findByFamily(familyId).stream()
            .map(GenerationDto::from)
            .toList();
    }

    @Transactional
    public GenerationDto create(UUID familyId, CreateGenerationRequest req, User user) {
        Family f = familyRepository.findById(familyId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy gia tộc"));
        String role = roleResolver.resolveRole(familyId, user);
        if (role == null) {
            throw new ForbiddenException("Bạn không phải thành viên của gia tộc này");
        }
        // Editors and admins can create generations.
        if (!(FamilyRoleResolver.ADMIN.equals(role)
                || FamilyRoleResolver.EDITOR.equals(role))) {
            throw new ForbiddenException("Chỉ admin hoặc editor mới có thể tạo thế hệ");
        }

        String name = req.getName() != null && !req.getName().isBlank()
            ? req.getName()
            : "Đời " + req.getGenerationNumber();

        Generation g = Generation.builder()
            .familyId(familyId)
            .generationNumber(req.getGenerationNumber())
            .name(name)
            .startYear(req.getStartYear())
            .endYear(req.getEndYear())
            .description(req.getDescription())
            .build();
        try {
            Generation saved = generationRepository.insert(g);
            return GenerationDto.from(saved);
        } catch (DuplicateKeyException ex) {
            throw new BadRequestException("Thế hệ thứ " + req.getGenerationNumber() + " đã tồn tại");
        } catch (org.springframework.dao.DataIntegrityViolationException ex) {
            throw new BadRequestException("Thế hệ thứ " + req.getGenerationNumber() + " đã tồn tại");
        }
    }

    @Transactional
    public MessageResponse delete(UUID generationId, User user) {
        Generation g = generationRepository.findById(generationId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thế hệ"));
        String role = roleResolver.resolveRole(g.getFamilyId(), user);
        if (!FamilyRoleResolver.ADMIN.equals(role)) {
            throw new ForbiddenException("Chỉ admin mới có thể xoá thế hệ");
        }
        int membersInGen = generationRepository.countMembersInGeneration(generationId);
        if (membersInGen > 0) {
            throw new BadRequestException(
                "Không thể xoá thế hệ đang có " + membersInGen + " thành viên. Hãy chuyển hoặc xoá thành viên trước.");
        }
        generationRepository.deleteById(generationId);
        log.info("Generation {} deleted by user {}", generationId, user.getId());
        return MessageResponse.builder()
            .message("Đã xoá thế hệ")
            .build();
    }
}
