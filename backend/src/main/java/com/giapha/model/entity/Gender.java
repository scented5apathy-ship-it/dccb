package com.giapha.model.entity;

/**
 * Mirrors the CHECK constraint on caygiaphaso.family_members.gender.
 */
public enum Gender {
    MALE,
    FEMALE,
    OTHER;

    public static Gender parse(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return Gender.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid gender: " + raw);
        }
    }
}
