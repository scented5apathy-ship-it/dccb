package com.giapha.model.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * caygiaphaso.relationships row.
 *
 * <p>{@code type} is stored as the enum constant name (e.g. PARENT, SPOUSE) —
 * the underlying column has a matching CHECK constraint.</p>
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Relationship {
    private UUID id;
    private UUID familyId;
    private UUID fromMemberId;
    private UUID toMemberId;
    private RelationshipType type;
    private LocalDate startDate;
    private LocalDate endDate;
    private String notes;
    private OffsetDateTime createdAt;
}
