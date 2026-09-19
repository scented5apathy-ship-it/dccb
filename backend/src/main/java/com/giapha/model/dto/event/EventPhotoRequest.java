package com.giapha.model.dto.event;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class EventPhotoRequest {
    @NotBlank
    private String photoUrl;
    private String caption;
}