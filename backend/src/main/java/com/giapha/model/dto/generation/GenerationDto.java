package com.giapha.model.dto.generation;

import com.giapha.model.entity.Generation;
import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class GenerationDto {
    private UUID id;
    private UUID familyId;
    private Integer generationNumber;
    private String name;
    private Integer startYear;
    private Integer endYear;
    private String description;
    private OffsetDateTime createdAt;

    public static GenerationDto from(Generation g) {
        if (g == null) return null;
        return GenerationDto.builder()
            .id(g.getId())
            .familyId(g.getFamilyId())
            .generationNumber(g.getGenerationNumber())
            .name(g.getName())
            .startYear(g.getStartYear())
            .endYear(g.getEndYear())
            .description(g.getDescription())
            .createdAt(g.getCreatedAt())
            .build();
    }
}
