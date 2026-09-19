package com.giapha.model.entity;

/**
 * Family heritage category. Mirrors caygiaphaso.family_heritages.heritage_type.
 */
public enum HeritageType {
    MOTTO,
    SYMBOL,
    TRADITION,
    SONG,
    STORY,
    RECIPE;

    public static HeritageType parse(String raw) {
        if (raw == null) {
            throw new IllegalArgumentException("heritage_type is required");
        }
        try {
            return HeritageType.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid heritage_type: " + raw);
        }
    }
}
