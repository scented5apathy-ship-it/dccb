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
public class Story {
    private UUID id;
    private UUID familyId;
    private UUID authorId;
    private String title;
    private String content;
    private LocalDate storyDate;
    private String storyLocation;
    private List<UUID> relatedMemberIds;
    private UUID relatedGenerationId;
    private Boolean isFeatured;
    private Integer viewCount;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}