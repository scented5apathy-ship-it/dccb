package com.giapha.model.dto.family;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Body for POST /api/families/{familyId}/invitations.
 */
@Data
public class CreateInvitationRequest {

    @NotBlank
    @Email(message = "Email không hợp lệ")
    private String inviteeEmail;

    /** ADMIN / EDITOR / VIEWER — defaults to VIEWER if absent. */
    private String role;
}
