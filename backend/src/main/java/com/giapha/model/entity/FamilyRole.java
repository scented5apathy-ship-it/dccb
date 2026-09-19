package com.giapha.model.entity;

/**
 * Role granted by an invitation (or implicitly for the family creator).
 * Mirrors the CHECK constraint on caygiaphaso.family_invitations.role.
 */
public enum FamilyRole {
    ADMIN,
    EDITOR,
    VIEWER;

    public static FamilyRole parse(String raw) {
        if (raw == null) {
            return VIEWER;
        }
        try {
            return FamilyRole.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid role: " + raw);
        }
    }
}
