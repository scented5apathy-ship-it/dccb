package com.giapha.model.dto.tc;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDate;
import java.util.UUID;

@Data
public class CreateTimeCapsuleRequest {
    @NotBlank
    private String title;
    private String content;
    private String mediaUrl;
    private UUID recipientMemberId;
    @NotNull
    private LocalDate unlockDate;
    @NotBlank
    private String unlockCondition;   // DATE / EVENT / MANUAL
    private String unlockEvent;
}