package com.giapha.model.dto.heritage;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateHeritageRequest {

    @NotBlank(message = "heritage_type là bắt buộc")
    private String heritageType;     // MOTTO / SYMBOL / TRADITION / SONG / STORY / RECIPE

    @NotBlank(message = "Tiêu đề là bắt buộc")
    private String title;

    private String description;

    private String mediaUrl;

    private Integer yearEstablished;
}
