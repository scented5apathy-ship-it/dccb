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
public class ChatMember {
    private UUID id;
    private UUID chatId;
    private UUID userId;
    private OffsetDateTime joinedAt;
    private OffsetDateTime lastReadAt;
    private String role;
}