package com.giapha.model.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EventAttendee {
    private UUID id;
    private UUID eventId;
    private UUID memberId;
    private String rsvpStatus;
    private String notes;
    private OffsetDateTime respondedAt;
}