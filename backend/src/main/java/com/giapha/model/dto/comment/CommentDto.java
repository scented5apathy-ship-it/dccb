package com.giapha.model.dto.comment;

import com.giapha.model.dto.common.UserSummary;
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
public class CommentDto {
    private UUID id;
    private UUID recipeId;
    private UUID userId;
    private UUID parentCommentId;
    private String content;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private UserSummary user;
}