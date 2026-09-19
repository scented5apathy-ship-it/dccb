package com.giapha.service;

import com.giapha.exception.UnauthorizedException;
import com.giapha.model.entity.RefreshToken;
import com.giapha.repository.RefreshTokenRepository;
import com.giapha.util.StringUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Manages refresh-token persistence: issuance, validation, revocation.
 *
 * <p>Tokens are opaque random UUIDs (not JWTs) so they can be revoked
 * individually. Default lifetime is 7 days.
 */
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    /** Refresh-token lifetime in seconds. Default: 7 days. */
    @Value("${jwt.refresh-expiration-seconds:604800}")
    private long refreshExpirationSeconds;

    private final RefreshTokenRepository refreshTokenRepository;

    /**
     * Create and persist a new refresh token for the given user.
     */
    @Transactional
    public RefreshToken createForUser(UUID userId) {
        OffsetDateTime expiresAt = OffsetDateTime.now().plusSeconds(refreshExpirationSeconds);

        RefreshToken token = RefreshToken.builder()
            .userId(userId)
            .token(StringUtil.generateUuid())
            .expiresAt(expiresAt)
            .build();

        return refreshTokenRepository.save(token);
    }

    /**
     * Look up a token and validate it (exists, not revoked, not expired).
     * Throws {@link UnauthorizedException} on any failure.
     */
    @Transactional(readOnly = true)
    public RefreshToken validateAndGet(String token) {
        if (!StringUtil.hasText(token)) {
            throw new UnauthorizedException("Refresh token không hợp lệ");
        }
        RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
            .orElseThrow(() -> new UnauthorizedException("Refresh token không hợp lệ"));

        if (refreshToken.isRevoked()) {
            throw new UnauthorizedException("Refresh token đã bị thu hồi");
        }
        if (refreshToken.isExpired()) {
            throw new UnauthorizedException("Refresh token đã hết hạn");
        }
        return refreshToken;
    }

    /**
     * Revoke a single refresh token. Idempotent — returns whether anything was
     * actually revoked.
     */
    @Transactional
    public boolean revoke(String token) {
        if (!StringUtil.hasText(token)) {
            return false;
        }
        int rows = refreshTokenRepository.revokeByToken(token);
        return rows > 0;
    }

    /**
     * Revoke every active refresh token for a user. Used for "logout
     * everywhere" or as a default when a logout call doesn't name a specific
     * refresh token.
     */
    @Transactional
    public int revokeAllForUser(UUID userId) {
        return refreshTokenRepository.revokeAllForUser(userId);
    }
}