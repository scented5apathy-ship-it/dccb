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
public class ChatMessage {
    private UUID id;
    private UUID chatId;
    private UUID senderId;
    private String content;
    private String messageType;
    private String attachmentUrl;
    private UUID replyToMessageId;
    private OffsetDateTime createdAt;
    private OffsetDateTime editedAt;
    private OffsetDateTime deletedAt;
}