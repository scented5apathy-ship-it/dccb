package com.giapha.model.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Entity mapping the caygiaphaso.users table.
 *
 * <p>Note: this is a plain DTO-style class, not a JPA entity. Persistence is
 * handled by UserRepository via raw JdbcTemplate SQL.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    private UUID id;
    private String email;
    private String passwordHash;
    private String fullName;
    private String avatarUrl;
    private String phone;
    private String bio;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
    private OffsetDateTime lastLoginAt;
    private Boolean isActive;
    private Boolean emailVerified;
}