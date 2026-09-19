package com.giapha.model.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * caygiaphaso.generations row.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Generation {
    private UUID id;
    private UUID familyId;
    private Integer generationNumber;
    private String name;
    private Integer startYear;
    private Integer endYear;
    private String description;
    private OffsetDateTime createdAt;
}
