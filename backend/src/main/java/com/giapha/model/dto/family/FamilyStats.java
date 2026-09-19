package com.giapha.model.dto.family;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FamilyStats {
    private Integer memberCount;
    private Integer generationCount;
    private Integer recipeCount;
    private Integer storyCount;
    private Integer eventCount;
    private Integer heritageCount;
}
