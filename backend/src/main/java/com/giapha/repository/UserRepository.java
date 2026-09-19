package com.giapha.repository;

import com.giapha.model.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.sql.Types;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Raw-SQL repository for caygiaphaso.users. Uses {@link JdbcTemplate} with a
 * single {@link RowMapper} shared across queries.
 */
@Repository
@RequiredArgsConstructor
public class UserRepository {

    private final JdbcTemplate jdbc;

    private static final String COLUMNS =
        "id, email, password_hash, full_name, avatar_url, phone, bio, " +
        "created_at, updated_at, last_login_at, is_active, email_verified";

    private static final RowMapper<User> USER_ROW_MAPPER = (rs, rowNum) -> mapUser(rs);

    // ------------------------------------------------------------------ //
    // Queries
    // ------------------------------------------------------------------ //

    public Optional<User> findById(UUID id) {
        String sql = "SELECT " + COLUMNS + " FROM caygiaphaso.users WHERE id = ?";
        try {
            User user = jdbc.queryForObject(sql, USER_ROW_MAPPER, id);
            return Optional.ofNullable(user);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public Optional<User> findByEmail(String email) {
        String sql = "SELECT " + COLUMNS + " FROM caygiaphaso.users WHERE email = ?";
        try {
            User user = jdbc.queryForObject(sql, USER_ROW_MAPPER, email);
            return Optional.ofNullable(user);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public boolean existsByEmail(String email) {
        String sql = "SELECT COUNT(*) FROM caygiaphaso.users WHERE email = ?";
        Integer count = jdbc.queryForObject(sql, Integer.class, email);
        return count != null && count > 0;
    }

    public User insert(User user) {
        String sql = "INSERT INTO caygiaphaso.users " +
            "(id, email, password_hash, full_name, avatar_url, phone, bio, " +
            "is_active, email_verified, created_at, updated_at) " +
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())";

        UUID id = user.getId() != null ? user.getId() : UUID.randomUUID();
        Boolean isActive = user.getIsActive() != null ? user.getIsActive() : Boolean.TRUE;
        Boolean emailVerified = user.getEmailVerified() != null ? user.getEmailVerified() : Boolean.FALSE;

        jdbc.update(con -> {
            PreparedStatement ps = con.prepareStatement(sql);
            ps.setObject(1, id);
            ps.setString(2, user.getEmail());
            ps.setString(3, user.getPasswordHash());
            ps.setString(4, user.getFullName());
            setNullableString(ps, 5, user.getAvatarUrl());
            setNullableString(ps, 6, user.getPhone());
            setNullableString(ps, 7, user.getBio());
            ps.setBoolean(8, isActive);
            ps.setBoolean(9, emailVerified);
            return ps;
        });

        return findById(id).orElseThrow(() ->
            new IllegalStateException("Failed to load user after insert: " + id));
    }

    public void updateLastLogin(UUID id) {
        String sql = "UPDATE caygiaphaso.users SET last_login_at = NOW() WHERE id = ?";
        jdbc.update(sql, id);
    }

    /**
     * Returns lightweight {@link UserSummary} records for a list of user ids.
     * Uses an IN(...) clause; the caller is responsible for keeping the
     * collection size reasonable.
     */
    public java.util.List<UserSummary> findSummariesByIds(java.util.Collection<UUID> ids) {
        if (ids == null || ids.isEmpty()) return java.util.List.of();
        StringBuilder sb = new StringBuilder(
            "SELECT id, full_name, email, avatar_url FROM caygiaphaso.users WHERE id IN (");
        int i = 0;
        for (UUID ignored : ids) {
            if (i > 0) sb.append(',');
            sb.append('?');
            i++;
        }
        sb.append(')');
        return jdbc.query(sb.toString(),
            (rs, n) -> new UserSummary(
                rs.getObject("id", UUID.class),
                rs.getString("full_name"),
                rs.getString("email"),
                rs.getString("avatar_url")
            ),
            ids.toArray());
    }

    /** Lightweight user projection used by services that need to render a list of authors. */
    public record UserSummary(UUID id, String fullName, String email, String avatarUrl) {}

    /**
     * Update mutable profile fields. updated_at is bumped automatically by the
     * trg_users_updated_at trigger.
     */
    public User updateProfile(UUID id, String fullName, String phone, String bio, String avatarUrl) {
        String sql = "UPDATE caygiaphaso.users SET " +
            "full_name = ?, phone = ?, bio = ?, avatar_url = ? " +
            "WHERE id = ?";
        jdbc.update(sql,
            fullName,
            phone,
            bio,
            avatarUrl,
            id);
        return findById(id).orElseThrow(() ->
            new IllegalStateException("Failed to load user after update: " + id));
    }

    /**
     * Case-insensitive search on full_name OR email. Capped at 20 rows.
     * Uses ILIKE so users can type partial names / emails.
     */
    public List<User> search(String query, int limit) {
        String sql = "SELECT " + COLUMNS + " FROM caygiaphaso.users " +
            "WHERE is_active = TRUE " +
            "AND (full_name ILIKE ? OR email ILIKE ?) " +
            "ORDER BY full_name ASC " +
            "LIMIT ?";
        String like = "%" + query + "%";
        return jdbc.query(sql, USER_ROW_MAPPER, like, like, limit);
    }

    // ------------------------------------------------------------------ //
    // Row mapping
    // ------------------------------------------------------------------ //

    private static User mapUser(ResultSet rs) throws SQLException {
        return User.builder()
            .id(rs.getObject("id", UUID.class))
            .email(rs.getString("email"))
            .passwordHash(rs.getString("password_hash"))
            .fullName(rs.getString("full_name"))
            .avatarUrl(rs.getString("avatar_url"))
            .phone(rs.getString("phone"))
            .bio(rs.getString("bio"))
            .createdAt(toOffsetDateTime(rs.getTimestamp("created_at")))
            .updatedAt(toOffsetDateTime(rs.getTimestamp("updated_at")))
            .lastLoginAt(toOffsetDateTime(rs.getTimestamp("last_login_at")))
            .isActive(rs.getBoolean("is_active"))
            .emailVerified(rs.getBoolean("email_verified"))
            .build();
    }

    private static void setNullableString(PreparedStatement ps, int parameterIndex, String value)
            throws SQLException {
        if (value == null) {
            ps.setNull(parameterIndex, Types.VARCHAR);
        } else {
            ps.setString(parameterIndex, value);
        }
    }

    private static OffsetDateTime toOffsetDateTime(Timestamp ts) {
        if (ts == null) {
            return null;
        }
        return ts.toInstant().atOffset(ZoneOffset.UTC);
    }
}