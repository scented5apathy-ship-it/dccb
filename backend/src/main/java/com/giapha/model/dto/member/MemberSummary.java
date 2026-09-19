package com.giapha.model.dto.member;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Light-weight member representation — used as a relationship target and as
 * a node in the family tree response so the payload does not blow up.
 */
@Data
@Builder
public class MemberSummary {
    private UUID id;
    private String fullName;
    private String nickname;
    private String gender;
    private LocalDate birthDate;
    private LocalDate deathDate;
    private Boolean isAlive;
    private UUID generationId;
    private Integer generationNumber;
    private String avatarUrl;
}
