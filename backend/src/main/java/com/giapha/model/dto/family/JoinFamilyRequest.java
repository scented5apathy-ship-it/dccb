package com.giapha.model.dto.family;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class JoinFamilyRequest {

    @NotBlank(message = "Mã mời là bắt buộc")
    private String inviteCode;
}
