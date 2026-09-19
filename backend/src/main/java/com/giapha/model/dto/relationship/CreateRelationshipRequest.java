package com.giapha.model.dto.relationship;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class CreateRelationshipRequest {

    @NotNull(message = "familyId là bắt buộc")
    private UUID familyId;

    @NotNull(message = "fromMemberId là bắt buộc")
    private UUID fromMemberId;

    @NotNull(message = "toMemberId là bắt buộc")
    private UUID toMemberId;

    /** PARENT / CHILD / SPOUSE / SIBLING / ADOPTED / GODPARENT */
    @NotNull(message = "relationshipType là bắt buộc")
    private String relationshipType;

    private LocalDate startDate;

    private String notes;
}
