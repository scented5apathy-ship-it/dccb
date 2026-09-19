package com.giapha.model.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FamilyChat {
    private UUID id;
    private UUID familyId;
    private String name;
    private String description;
    private UUID createdBy;
    private OffsetDateTime createdAt;
}