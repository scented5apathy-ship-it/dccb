package com.giapha.model.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * caygiaphaso.family_members row. Domain object — repositories handle SQL
 * mapping so this class stays free of JDBC annotations.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FamilyMember {
    private UUID id;
    private UUID familyId;
    private UUID userId;
    private String fullName;
    private String nickname;
    private String avatarUrl;
    private Gender gender;
    private LocalDate birthDate;
    private LocalDate deathDate;
    private String birthPlace;
    private String currentLocation;
    private String occupation;
    private String biography;
    private UUID generationId;
    private Boolean isAlive;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
