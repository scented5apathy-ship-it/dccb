package com.giapha.model.dto.event;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.UUID;

@Data
public class RsvpRequest {
    @NotNull
    private UUID memberId;
    @NotBlank
    private String rsvpStatus;   // GOING / MAYBE / NOT_GOING
    private String notes;
}