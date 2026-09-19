package com.giapha.model.dto.family;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateFamilyRequest {

    @Size(max = 200)
    private String name;

    private String description;

    private String motto;

    private String originLocation;

    private String logoUrl;

    private String coverImageUrl;
}
