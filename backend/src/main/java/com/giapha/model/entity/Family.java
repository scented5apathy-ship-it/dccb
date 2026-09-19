package com.giapha.model.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * caygiaphaso.families row.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Family {
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
}
