package com.giapha.model.dto.origin;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOriginRequest {

    @NotNull
    private UUID fromMemberId;

    @NotNull
    private UUID toMemberId;

    private Integer yearTransmitted;
    private Integer generationGap;
    private String story;
}