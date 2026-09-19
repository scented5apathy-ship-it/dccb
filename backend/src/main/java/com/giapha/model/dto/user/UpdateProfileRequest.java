package com.giapha.model.dto.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {

    @NotBlank(message = "Họ tên không được để trống")
    @Size(max = 255, message = "Họ tên không được vượt quá 255 ký tự")
    private String fullName;

    @Size(max = 32, message = "Số điện thoại không được vượt quá 32 ký tự")
    private String phone;

    @Size(max = 2000, message = "Tiểu sử không được vượt quá 2000 ký tự")
    private String bio;

    @Size(max = 1024, message = "URL avatar không được vượt quá 1024 ký tự")
    private String avatarUrl;
}