package com.giapha.repository;

import com.giapha.model.entity.RefreshToken;
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
import java.util.Optional;
import java.util.UUID;

/**
 * Raw-SQL repository for caygiaphaso.refresh_tokens.
 */
@Repository
@RequiredArgsConstructor
public class RefreshTokenRepository {

    private final JdbcTemplate jdbc;

    private static final String COLUMNS =
        "id, user_id, token, expires_at, revoked_at, created_at";

    private static final RowMapper<RefreshToken> REFRESH_TOKEN_MAPPER =
        (rs, rowNum) -> mapRefreshToken(rs);

    public RefreshToken save(RefreshToken token) {
        String sql = "INSERT INTO caygiaphaso.refresh_tokens " +
            "(id, user_id, token, expires_at, created_at) " +
            "VALUES (?, ?, ?, ?, NOW())";

        UUID id = token.getId() != null ? token.getId() : UUID.randomUUID();

        jdbc.update(con -> {
            PreparedStatement ps = con.prepareStatement(sql);
            ps.setObject(1, id);
            ps.setObject(2, token.getUserId());
            ps.setString(3, token.getToken());
            ps.setTimestamp(4, Timestamp.from(token.getExpiresAt().toInstant()));
            return ps;
        });

        return findById(id).orElseThrow(() ->
            new IllegalStateException("Failed to load refresh token after insert: " + id));
    }

    public Optional<RefreshToken> findByToken(String token) {
        String sql = "SELECT " + COLUMNS + " FROM caygiaphaso.refresh_tokens WHERE token = ?";
        try {
            RefreshToken rt = jdbc.queryForObject(sql, REFRESH_TOKEN_MAPPER, token);
            return Optional.ofNullable(rt);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    public Optional<RefreshToken> findById(UUID id) {
        String sql = "SELECT " + COLUMNS + " FROM caygiaphaso.refresh_tokens WHERE id = ?";
        try {
            RefreshToken rt = jdbc.queryForObject(sql, REFRESH_TOKEN_MAPPER, id);
            return Optional.ofNullable(rt);
        } catch (EmptyResultDataAccessException e) {
            return Optional.empty();
        }
    }

    /**
     * Mark a single token as revoked. Returns the number of rows affected.
     * Idempotent: revoking an already-revoked token still counts as success.
     */
    public int revokeByToken(String token) {
        String sql = "UPDATE caygiaphaso.refresh_tokens " +
            "SET revoked_at = NOW() " +
            "WHERE token = ? AND revoked_at IS NULL";
        return jdbc.update(sql, token);
    }

    /**
     * Revoke every active refresh token for a user. Useful for "log out
     * everywhere" semantics.
     */
    public int revokeAllForUser(UUID userId) {
        String sql = "UPDATE caygiaphaso.refresh_tokens " +
            "SET revoked_at = NOW() " +
            "WHERE user_id = ? AND revoked_at IS NULL";
        return jdbc.update(sql, userId);
    }

    /**
     * Hard-delete expired or revoked tokens. Called occasionally to keep the
     * table small. Returns the number of rows purged.
     */
    public int purgeExpiredAndRevoked() {
        String sql = "DELETE FROM caygiaphaso.refresh_tokens " +
            "WHERE revoked_at IS NOT NULL OR expires_at < NOW()";
        return jdbc.update(sql);
    }

    // ------------------------------------------------------------------ //
    // Row mapping
    // ------------------------------------------------------------------ //

    private static RefreshToken mapRefreshToken(ResultSet rs) throws SQLException {
        return RefreshToken.builder()
            .id(rs.getObject("id", UUID.class))
            .userId(rs.getObject("user_id", UUID.class))
            .token(rs.getString("token"))
            .expiresAt(toOffsetDateTime(rs.getTimestamp("expires_at")))
            .revokedAt(toOffsetDateTime(rs.getTimestamp("revoked_at")))
            .createdAt(toOffsetDateTime(rs.getTimestamp("created_at")))
            .build();
    }

    private static OffsetDateTime toOffsetDateTime(Timestamp ts) {
        if (ts == null) {
            return null;
        }
        return ts.toInstant().atOffset(ZoneOffset.UTC);
    }
}