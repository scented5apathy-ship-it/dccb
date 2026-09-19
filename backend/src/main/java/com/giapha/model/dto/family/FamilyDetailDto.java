package com.giapha.model.dto.family;

import com.giapha.model.dto.generation.GenerationDto;
import com.giapha.model.dto.heritage.HeritageDto;
import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * Used by GET /api/families/{familyId} to return family + generations +
 * heritages + aggregate stats in a single payload.
 */
@Data
@Builder
public class FamilyDetailDto {
    private FamilyDto family;
    private String role;
    private List<GenerationDto> generations;
    private List<HeritageDto> heritages;
    private FamilyStats stats;
}
