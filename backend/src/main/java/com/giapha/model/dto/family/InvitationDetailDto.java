package com.giapha.model.dto.family;

import lombok.Builder;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Invitation as shown in the history list.
 *
 * Includes computed {@code status} (PENDING / ACCEPTED / EXPIRED / REVOKED)
 * and the invitee's display name if they've since joined the family.
 */
@Data
@Builder
public class InvitationDetailDto {
    private UUID id;
    private UUID familyId;
    private UUID inviterId;
    private String inviterName;
    private String inviteeEmail;
    private String inviteeName;
    private String inviteCode;
    private String inviteUrl;
    private String role;
    /** Computed: PENDING | ACCEPTED | EXPIRED | REVOKED */
    private String status;
    private OffsetDateTime expiresAt;
    private OffsetDateTime acceptedAt;
    private OffsetDateTime createdAt;
}