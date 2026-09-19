package com.giapha.model.dto.album;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateAlbumRequest {
    @NotBlank
    private String title;
    private String description;
    private String coverPhotoUrl;
}