package com.giapha.model.dto.member;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

/**
 * Request body for {@code PUT /families/{familyId}/members/{memberId}/role}.
 * Only ADMIN users may call it; the role applies going forward and is the
 * "effective" role used by {@code FamilyRoleResolver}.
 */
@Data
public class UpdateMemberRoleRequest {

    @NotBlank
    @Pattern(regexp = "ADMIN|EDITOR|VIEWER",
        message = "role phải là ADMIN, EDITOR hoặc VIEWER")
    private String role;
}