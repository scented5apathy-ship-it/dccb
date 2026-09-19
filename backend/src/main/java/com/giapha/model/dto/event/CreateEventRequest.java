package com.giapha.model.dto.event;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data
public class CreateEventRequest {
    @NotBlank
    private String title;
    private String description;
    @NotBlank
    private String eventType;       // WEDDING / FUNERAL / etc
    @NotNull
    private OffsetDateTime eventDate;
    private OffsetDateTime endDate;
    private String location;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String coverImageUrl;
    private List<UUID> attendeeMemberIds;
}