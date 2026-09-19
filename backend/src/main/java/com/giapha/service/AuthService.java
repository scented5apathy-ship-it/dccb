package com.giapha.service;

import com.giapha.exception.BadRequestException;
import com.giapha.exception.UnauthorizedException;
import com.giapha.model.dto.auth.AuthResponse;
import com.giapha.model.dto.auth.LoginRequest;
import com.giapha.model.dto.auth.RegisterRequest;
import com.giapha.model.dto.auth.UserDto;
import com.giapha.model.entity.RefreshToken;
import com.giapha.model.entity.User;
import com.giapha.repository.UserRepository;
import com.giapha.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.UUID;

/**
 * Handles the authentication flows: register, login, refresh, logout.
 *
 * <p>The access token is a JWT; the refresh token is a random opaque UUID
 * persisted in the refresh_tokens table so it can be revoked.
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenService refreshTokenService;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;

    // ------------------------------------------------------------------ //
    // Register
    // ------------------------------------------------------------------ //

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = normalizeEmail(request.getEmail());

        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("Email đã được sử dụng");
        }

        User newUser = User.builder()
            .email(email)
            .passwordHash(passwordEncoder.encode(request.getPassword()))
            .fullName(request.getFullName().trim())
            .phone(request.getPhone())
            .isActive(true)
            .emailVerified(false)
            .build();

        User saved = userRepository.insert(newUser);

        return buildAuthResponse(saved);
    }

    // ------------------------------------------------------------------ //
    // Login
    // ------------------------------------------------------------------ //

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String email = normalizeEmail(request.getEmail());

        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new UnauthorizedException("Email hoặc mật khẩu không đúng"));

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new UnauthorizedException("Tài khoản đã bị vô hiệu hóa");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Email hoặc mật khẩu không đúng");
        }

        userRepository.updateLastLogin(user.getId());

        // Refresh the entity to pick up last_login_at timestamp.
        User refreshed = userRepository.findById(user.getId()).orElse(user);

        return buildAuthResponse(refreshed);
    }

    // ------------------------------------------------------------------ //
    // Refresh
    // ------------------------------------------------------------------ //

    @Transactional
    public AuthResponse refresh(String refreshTokenValue) {
        RefreshToken token = refreshTokenService.validateAndGet(refreshTokenValue);

        // Rotate: revoke the used refresh token and issue a brand new pair.
        refreshTokenService.revoke(refreshTokenValue);

        User user = userRepository.findById(token.getUserId())
            .orElseThrow(() -> new UnauthorizedException("Người dùng không tồn tại"));

        if (!Boolean.TRUE.equals(user.getIsActive())) {
            throw new UnauthorizedException("Tài khoản đã bị vô hiệu hóa");
        }

        return buildAuthResponse(user);
    }

    // ------------------------------------------------------------------ //
    // Logout
    // ------------------------------------------------------------------ //

    @Transactional
    public void logout(UUID userId, String optionalRefreshToken) {
        if (optionalRefreshToken != null && !optionalRefreshToken.isBlank()) {
            // Revoke only the supplied refresh token if it belongs to this user.
            RefreshToken existing = refreshTokenService.validateAndGet(optionalRefreshToken);
            if (!existing.getUserId().equals(userId)) {
                throw new UnauthorizedException("Refresh token không thuộc về người dùng hiện tại");
            }
            refreshTokenService.revoke(optionalRefreshToken);
        } else {
            // No specific token named — revoke every active session for safety.
            refreshTokenService.revokeAllForUser(userId);
        }
    }

    // ------------------------------------------------------------------ //
    // Helpers
    // ------------------------------------------------------------------ //

    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtUtil.generateToken(user.getId(), user.getEmail());
        RefreshToken refreshToken = refreshTokenService.createForUser(user.getId());

        return AuthResponse.builder()
            .user(UserDto.fromEntity(user))
            .accessToken(accessToken)
            .refreshToken(refreshToken.getToken())
            .tokenType("Bearer")
            .expiresIn(jwtUtil.getExpirationMs() / 1000L)
            .build();
    }

    private static String normalizeEmail(String email) {
        if (email == null) {
            return null;
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }
}