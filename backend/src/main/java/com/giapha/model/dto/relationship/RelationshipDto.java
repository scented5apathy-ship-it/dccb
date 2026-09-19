package com.giapha.model.dto.relationship;

import com.giapha.model.entity.Relationship;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class RelationshipDto {
    private UUID id;
    private UUID familyId;
    private UUID fromMemberId;
    private String fromMemberName;
    private UUID toMemberId;
    private String toMemberName;
    private String relationshipType;
    private LocalDate startDate;
    private LocalDate endDate;
    private String notes;
    private OffsetDateTime createdAt;

    public static RelationshipDto from(Relationship r) {
        if (r == null) return null;
        return RelationshipDto.builder()
            .id(r.getId())
            .familyId(r.getFamilyId())
            .fromMemberId(r.getFromMemberId())
            .toMemberId(r.getToMemberId())
            .relationshipType(r.getType() == null ? null : r.getType().name())
            .startDate(r.getStartDate())
            .endDate(r.getEndDate())
            .notes(r.getNotes())
            .createdAt(r.getCreatedAt())
            .build();
    }
}
