package com.giapha.model.dto.achievement;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AwardAchievementRequest {
    @NotBlank
    private String achievementCode;
    private String notes;
}