package com.giapha.model.dto.origin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Genealogy edge payload: who received the recipe from whom, with the
 * surrounding context (year, gap, story). Member summaries are inlined so
 * the UI can render the lineage without a second round-trip.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OriginDto {
    private UUID id;
    private UUID recipeId;
    private UUID fromMemberId;
    private UUID toMemberId;
    private Integer yearTransmitted;
    private Integer generationGap;
    private String story;
    private OffsetDateTime createdAt;

    private MemberSummary fromMember;
    private MemberSummary toMember;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MemberSummary {
        private UUID id;
        private String fullName;
        private Integer generationNumber;
        private String generationName;
    }
}