package com.giapha.model.dto.user;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.giapha.model.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Lightweight user projection for search results. Excludes bio and timestamps
 * to keep search payloads small.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class UserSearchResult {

    private UUID id;
    private String email;
    private String fullName;
    private String avatarUrl;
    private Boolean emailVerified;

    public static UserSearchResult fromEntity(User user) {
        if (user == null) {
            return null;
        }
        return UserSearchResult.builder()
            .id(user.getId())
            .email(user.getEmail())
            .fullName(user.getFullName())
            .avatarUrl(user.getAvatarUrl())
            .emailVerified(user.getEmailVerified())
            .build();
    }
}