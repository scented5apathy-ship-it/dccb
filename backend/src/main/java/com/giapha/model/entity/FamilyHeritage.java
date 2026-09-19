package com.giapha.model.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * caygiaphaso.family_heritages row.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FamilyHeritage {
    private UUID id;
    private UUID familyId;
    private HeritageType heritageType;
    private String title;
    private String description;
    private String mediaUrl;
    private Integer yearEstablished;
    private UUID createdBy;
    private OffsetDateTime createdAt;
}
