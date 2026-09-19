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
public class EventPhoto {
    private UUID id;
    private UUID eventId;
    private String photoUrl;
    private String caption;
    private UUID uploadedBy;
    private OffsetDateTime uploadedAt;
}