package com.giapha.model.dto.family;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateFamilyRequest {

    @NotBlank(message = "Tên gia tộc là bắt buộc")
    @Size(max = 200, message = "Tên không quá 200 ký tự")
    private String name;

    private String description;

    private Integer foundedYear;

    private String motto;

    private String originLocation;
}
