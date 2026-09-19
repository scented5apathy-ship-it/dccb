package com.giapha.model.dto.chat;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.UUID;

@Data
public class SendMessageRequest {
    @NotBlank
    private String content;
    @NotBlank
    private String messageType;   // TEXT / IMAGE / FILE
    private String attachmentUrl;
    private UUID replyToMessageId;
}