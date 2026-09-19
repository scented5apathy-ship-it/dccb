package com.giapha.model.dto.family;

import com.giapha.model.entity.Family;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Plain family projection used in list / create / update responses.
 */
@Data
@Builder
public class FamilyDto {
    private UUID id;
    private String name;
    private String description;
    private Integer foundedYear;
    private String motto;
    private String logoUrl;
    private String coverImageUrl;
    private String originLocation;
    private Integer memberCount;
    private UUID createdBy;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public static FamilyDto from(Family f) {
        if (f == null) return null;
        return FamilyDto.builder()
            .id(f.getId())
            .name(f.getName())
            .description(f.getDescription())
            .foundedYear(f.getFoundedYear())
            .motto(f.getMotto())
            .logoUrl(f.getLogoUrl())
            .coverImageUrl(f.getCoverImageUrl())
            .originLocation(f.getOriginLocation())
            .memberCount(f.getMemberCount())
            .createdBy(f.getCreatedBy())
            .createdAt(f.getCreatedAt())
            .updatedAt(f.getUpdatedAt())
            .build();
    }
}
