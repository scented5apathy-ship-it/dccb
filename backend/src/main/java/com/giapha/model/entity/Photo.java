package com.giapha.model.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Photo {
    private UUID id;
    private UUID albumId;
    private UUID uploaderId;
    private String photoUrl;
    private String caption;
    private LocalDate photoDate;
    private String photoLocation;
    private List<UUID> memberIds;
    private OffsetDateTime createdAt;
}