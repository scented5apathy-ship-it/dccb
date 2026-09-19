package com.giapha.util;

import com.giapha.exception.ForbiddenException;
import com.giapha.exception.UnauthorizedException;
import com.giapha.security.CustomUserDetails;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
public class AuthorizationHelper {

    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    public AuthorizationHelper(org.springframework.jdbc.core.JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public CustomUserDetails currentUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof CustomUserDetails u)) {
            throw new UnauthorizedException();
        }
        return u;
    }

    public UUID currentUserId() {
        return currentUser().getUser().getId();
    }

    public boolean isFamilyMember(UUID userId, UUID familyId) {
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM caygiaphaso.family_members " +
            "WHERE family_id = ? AND user_id = ?",
            Integer.class, familyId, userId
        );
        return count != null && count > 0;
    }

    public void requireFamilyMember(UUID userId, UUID familyId) {
        if (!isFamilyMember(userId, familyId)) {
            throw new ForbiddenException("Bạn không phải thành viên của gia đình này");
        }
    }

    public boolean isFamilyAdmin(UUID userId, UUID familyId) {
        Integer count = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM caygiaphaso.families " +
            "WHERE id = ? AND created_by = ?",
            Integer.class, familyId, userId
        );
        return count != null && count > 0;
    }

    public UUID familyIdOfMember(UUID memberId) {
        return jdbcTemplate.queryForObject(
            "SELECT family_id FROM caygiaphaso.family_members WHERE id = ?",
            UUID.class, memberId);
    }
}