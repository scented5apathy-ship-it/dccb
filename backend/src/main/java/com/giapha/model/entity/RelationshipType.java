package com.giapha.model.entity;

/**
 * Relationship between two family members. Mirrors the CHECK constraint on
 * caygiaphaso.relationships.relationship_type.
 */
public enum RelationshipType {
    PARENT,
    CHILD,
    SPOUSE,
    SIBLING,
    ADOPTED,
    GODPARENT;

    /**
     * @return the reciprocal type. PARENT↔CHILD, ADOPTED is self-reciprocal
     *         (we mirror the direction), SIBLING/GODPARENT/SPOUSE are self.
     */
    public RelationshipType reciprocal() {
        return switch (this) {
            case PARENT -> CHILD;
            case CHILD -> PARENT;
            default -> this;
        };
    }

    public static RelationshipType parse(String raw) {
        if (raw == null) {
            throw new IllegalArgumentException("relationship_type is required");
        }
        try {
            return RelationshipType.valueOf(raw.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Invalid relationship_type: " + raw);
        }
    }
}
