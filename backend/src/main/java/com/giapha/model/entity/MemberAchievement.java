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
public class MemberAchievement {
    private UUID id;
    private UUID memberId;
    private UUID achievementId;
    private OffsetDateTime earnedAt;
    private String notes;
}