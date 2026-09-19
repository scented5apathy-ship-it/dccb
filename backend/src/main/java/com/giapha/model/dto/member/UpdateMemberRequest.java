package com.giapha.model.dto.member;

import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Any subset of fields may be supplied; null/missing fields are left untouched.
 */
@Data
public class UpdateMemberRequest {

    private String fullName;

    private String nickname;

    private String avatarUrl;

    private String gender;

    private LocalDate birthDate;

    private LocalDate deathDate;

    private String birthPlace;

    private String currentLocation;

    private String occupation;

    private String biography;

    private UUID generationId;

    private UUID userId;

    private Boolean isAlive;
}
