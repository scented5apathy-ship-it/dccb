package com.giapha.service;

import com.giapha.exception.ForbiddenException;
import com.giapha.exception.ResourceNotFoundException;
import com.giapha.model.dto.heritage.CreateHeritageRequest;
import com.giapha.model.dto.heritage.HeritageDto;
import com.giapha.model.entity.Family;
import com.giapha.model.entity.FamilyHeritage;
import com.giapha.model.entity.HeritageType;
import com.giapha.model.entity.User;
import com.giapha.repository.FamilyRepository;
import com.giapha.repository.HeritageRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * CRUD for family_heritages (mottoes, symbols, traditions, songs, stories, recipes).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class HeritageService {

    private final HeritageRepository heritageRepository;
    private final FamilyRepository familyRepository;
    private final FamilyRoleResolver roleResolver;

    public List<HeritageDto> list(UUID familyId, User user) {
        Family f = familyRepository.findById(familyId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy gia tộc"));
        if (roleResolver.resolveRole(familyId, user) == null) {
            throw new ForbiddenException("Bạn không phải thành viên của gia tộc này");
        }
        return heritageRepository.findByFamily(familyId).stream()
            .map(HeritageDto::fromEntity)
            .toList();
    }

    @Transactional
    public HeritageDto create(UUID familyId, CreateHeritageRequest req, User user) {
        Family f = familyRepository.findById(familyId)
            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy gia tộc"));
        String role = roleResolver.resolveRole(familyId, user);
        if (role == null) {
            throw new ForbiddenException("Bạn không phải thành viên của gia tộc này");
        }
        if (!(FamilyRoleResolver.ADMIN.equals(role)
                || FamilyRoleResolver.EDITOR.equals(role)
                || FamilyRoleResolver.MEMBER.equals(role))) {
            throw new ForbiddenException("Bạn không có quyền tạo di sản");
        }

        HeritageType type = HeritageType.parse(req.getHeritageType());
        FamilyHeritage h = FamilyHeritage.builder()
            .familyId(familyId)
            .heritageType(type)
            .title(req.getTitle())
            .description(req.getDescription())
            .mediaUrl(req.getMediaUrl())
            .yearEstablished(req.getYearEstablished())
            .createdBy(user.getId())
            .build();
        FamilyHeritage saved = heritageRepository.insert(h);
        log.info("Heritage {} created in family {} by user {}", saved.getId(), familyId, user.getId());
        return HeritageDto.fromEntity(saved);
    }
}
