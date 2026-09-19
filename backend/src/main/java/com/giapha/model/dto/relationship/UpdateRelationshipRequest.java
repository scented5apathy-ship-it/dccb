package com.giapha.model.dto.relationship;

import lombok.Data;

import java.time.LocalDate;

@Data
public class UpdateRelationshipRequest {
    private LocalDate endDate;
    private String notes;
}
