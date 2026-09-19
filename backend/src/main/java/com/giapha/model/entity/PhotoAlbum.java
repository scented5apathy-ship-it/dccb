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
public class PhotoAlbum {
    private UUID id;
    private UUID familyId;
    private UUID creatorId;
    private String title;
    private String description;
    private String coverPhotoUrl;
    private OffsetDateTime createdAt;
}