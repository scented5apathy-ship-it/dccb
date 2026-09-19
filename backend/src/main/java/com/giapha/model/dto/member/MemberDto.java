package com.giapha.model.dto.member;

import com.giapha.model.entity.FamilyMember;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.Period;
import java.time.ZoneId;
import java.util.UUID;

@Data
@Builder
public class MemberDto {
    private UUID id;
    private UUID familyId;
    private UUID userId;
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
    private Integer generationNumber;
    private String generationName;
    private Boolean isAlive;
    private Integer age;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public static MemberDto from(FamilyMember m) {
        if (m == null) return null;
        return MemberDto.builder()
            .id(m.getId())
            .familyId(m.getFamilyId())
            .userId(m.getUserId())
            .fullName(m.getFullName())
            .nickname(m.getNickname())
            .avatarUrl(m.getAvatarUrl())
            .gender(m.getGender() == null ? null : m.getGender().name())
            .birthDate(m.getBirthDate())
            .deathDate(m.getDeathDate())
            .birthPlace(m.getBirthPlace())
            .currentLocation(m.getCurrentLocation())
            .occupation(m.getOccupation())
            .biography(m.getBiography())
            .generationId(m.getGenerationId())
            .isAlive(Boolean.TRUE.equals(m.getIsAlive()))
            .age(computeAge(m.getBirthDate(), m.getDeathDate(), Boolean.TRUE.equals(m.getIsAlive())))
            .createdAt(m.getCreatedAt())
            .updatedAt(m.getUpdatedAt())
            .build();
    }

    private static Integer computeAge(LocalDate birth, LocalDate death, boolean alive) {
        if (birth == null) return null;
        LocalDate end = !alive && death != null
            ? death
            : LocalDate.now(ZoneId.systemDefault());
        if (end.isBefore(birth)) return null;
        return Period.between(birth, end).getYears();
    }
}
