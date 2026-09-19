package com.giapha.model.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Event {
    private UUID id;
    private UUID familyId;
    private UUID creatorId;
    private String title;
    private String description;
    private String eventType;
    private OffsetDateTime eventDate;
    private OffsetDateTime endDate;
    private String location;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String coverImageUrl;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}