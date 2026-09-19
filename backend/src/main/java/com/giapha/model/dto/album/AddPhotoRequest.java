package com.giapha.model.dto.album;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
public class AddPhotoRequest {
    @NotBlank
    private String photoUrl;
    private String caption;
    private LocalDate photoDate;
    private String photoLocation;
    private List<UUID> memberIds;
}