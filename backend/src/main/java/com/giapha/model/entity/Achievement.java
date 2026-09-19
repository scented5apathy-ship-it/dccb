package com.giapha.model.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Achievement {
    private UUID id;
    private String code;
    private String name;
    private String description;
    private String iconUrl;
    private Integer points;
}