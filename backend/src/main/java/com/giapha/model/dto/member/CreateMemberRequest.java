package com.giapha.model.dto.member;

import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
public class CreateMemberRequest {

    private String fullName;

    private String nickname;

    /** MALE / FEMALE / OTHER */
    private String gender;

    private LocalDate birthDate;

    private LocalDate deathDate;

    private String birthPlace;

    private String currentLocation;

    private String occupation;

    private String biography;

    private UUID generationId;

    /** Optional — link to an existing system user. */
    private UUID userId;

    /** Defaults to TRUE. */
    private Boolean isAlive;
}
