package com.giapha.model.dto.story;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateStoryTagRequest {
    @NotBlank
    private String name;
}