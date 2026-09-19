package com.giapha.model.dto.generation;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CreateGenerationRequest {

    @NotNull(message = "Số thế hệ là bắt buộc")
    @Min(value = 1, message = "Số thế hệ phải >= 1")
    private Integer generationNumber;

    private String name;

    private Integer startYear;

    private Integer endYear;

    private String description;
}
