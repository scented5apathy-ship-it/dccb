package com.giapha.model.dto.event;

import lombok.Data;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data
public class UpdateEventRequest {
    private String title;
    private String description;
    private String eventType;
    private OffsetDateTime eventDate;
    private OffsetDateTime endDate;
    private String location;
    private BigDecimal latitude;
    private BigDecimal longitude;
    private String coverImageUrl;
}