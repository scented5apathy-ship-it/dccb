package com.giapha.model.dto.story;

import lombok.Data;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
public class CreateStoryRequest {
    private String title;
    private String content;
    private LocalDate storyDate;
    private String storyLocation;
    private List<UUID> relatedMemberIds;
    private UUID relatedGenerationId;
    private Boolean isFeatured;
    private List<MediaInput> media;
    private List<UUID> tagIds;

    @Data
    public static class MediaInput {
        private String mediaType;   // IMAGE / VIDEO / AUDIO / DOCUMENT
        private String mediaUrl;
        private String caption;
    }
}