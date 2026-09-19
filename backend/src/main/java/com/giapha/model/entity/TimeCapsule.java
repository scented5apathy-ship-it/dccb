package com.giapha.model.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimeCapsule {
    private UUID id;
    private UUID familyId;
    private UUID creatorId;
    private String title;
    private String content;
    private String mediaUrl;
    private UUID recipientMemberId;
    private LocalDate unlockDate;
    private String unlockCondition;
    private String unlockEvent;
    private Boolean isOpened;
    private OffsetDateTime openedAt;
    private UUID openedBy;
    private OffsetDateTime createdAt;
}