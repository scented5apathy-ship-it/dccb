package com.giapha.security;

import com.giapha.exception.UnauthorizedException;
import com.giapha.model.entity.User;
import com.giapha.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Helper that resolves the currently logged-in user.
 *
 * <p>Reads the email out of {@link SecurityContextHolder} (set by
 * {@link JwtAuthenticationFilter} as the JWT subject) and loads the full
 * {@link User} via {@link UserRepository}.
 */
@Component
@RequiredArgsConstructor
public class CurrentUser {

    private final UserRepository userRepository;

    /**
     * @return the email of the currently authenticated user
     * @throws UnauthorizedException if no authentication is present
     */
    public String getCurrentEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null
                || authentication.getPrincipal() == null
                || !authentication.isAuthenticated()
                || authentication instanceof org.springframework.security.authentication.AnonymousAuthenticationToken) {
            throw new UnauthorizedException("Bạn cần đăng nhập để thực hiện thao tác này");
        }
        return authentication.getName();
    }

    /**
     * @return the full {@link User} entity for the current request
     * @throws UnauthorizedException if no authentication is present
     * @throws com.giapha.exception.ResourceNotFoundException if the user has been deleted
     */
    public User getCurrentUser() {
        String email = getCurrentEmail();
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new UnauthorizedException("Người dùng không tồn tại"));
    }

    /**
     * @return the UUID of the currently authenticated user
     */
    public UUID getCurrentUserId() {
        return getCurrentUser().getId();
    }
}