package com.giapha.model.dto.family;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class InvitationResponse {
    private UUID id;
    private UUID familyId;
    private String inviteeEmail;
    private String role;
    private String inviteCode;
    private String inviteUrl;
    private OffsetDateTime expiresAt;
    private OffsetDateTime acceptedAt;
    private OffsetDateTime createdAt;
}
