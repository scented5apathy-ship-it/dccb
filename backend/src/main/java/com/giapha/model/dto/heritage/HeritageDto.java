package com.giapha.model.dto.heritage;

import com.giapha.model.entity.FamilyHeritage;
import com.giapha.model.entity.HeritageType;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Read-side projection of caygiaphaso.family_heritages used by
 * GET /api/families/{familyId} and other family-detail payloads.
 */
@Data
@Builder
public class HeritageDto {
    private UUID id;
    private UUID familyId;
    private HeritageType heritageType;
    private String title;
    private String description;
    private String mediaUrl;
    private Integer yearEstablished;
    private UUID createdBy;
    private OffsetDateTime createdAt;

    public static HeritageDto fromEntity(FamilyHeritage h) {
        if (h == null) return null;
        return HeritageDto.builder()
            .id(h.getId())
            .familyId(h.getFamilyId())
            .heritageType(h.getHeritageType())
            .title(h.getTitle())
            .description(h.getDescription())
            .mediaUrl(h.getMediaUrl())
            .yearEstablished(h.getYearEstablished())
            .createdBy(h.getCreatedBy())
            .createdAt(h.getCreatedAt())
            .build();
    }
}