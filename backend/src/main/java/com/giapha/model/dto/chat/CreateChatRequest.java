package com.giapha.model.dto.chat;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.util.List;
import java.util.UUID;

@Data
public class CreateChatRequest {
    @NotBlank
    private String name;
    private String description;
    private List<UUID> memberIds;
}