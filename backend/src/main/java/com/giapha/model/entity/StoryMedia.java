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
public class StoryMedia {
    private UUID id;
    private UUID storyId;
    private String mediaType;
    private String mediaUrl;
    private String caption;
    private Integer orderIndex;
    private OffsetDateTime uploadedAt;
}