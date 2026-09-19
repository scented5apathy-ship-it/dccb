package com.giapha.model.dto.family;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

/**
 * Used by GET /api/families to return each family the current user belongs to,
 * along with their effective role in that family.
 */
@Data
@Builder
public class FamilyWithRoleDto {
    private FamilyDto family;
    private String role;          // ADMIN / EDITOR / VIEWER
    private Integer memberCount;
    private Boolean isCreator;    // true when families.created_by = current user
}
