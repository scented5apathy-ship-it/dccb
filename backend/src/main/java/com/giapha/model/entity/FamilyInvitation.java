package com.giapha.model.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * caygiaphaso.family_invitations row.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FamilyInvitation {
    private UUID id;
    private UUID familyId;
    private UUID inviterId;
    private String inviteeEmail;
    private String inviteCode;
    private FamilyRole role;
    private OffsetDateTime expiresAt;
    private OffsetDateTime acceptedAt;
    private OffsetDateTime createdAt;
}
