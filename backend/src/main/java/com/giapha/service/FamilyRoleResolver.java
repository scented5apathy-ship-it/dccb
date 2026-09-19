package com.giapha.service;

import com.giapha.model.entity.FamilyRole;
import com.giapha.model.entity.User;
import com.giapha.repository.FamilyInvitationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Resolves the effective role a user has inside a family.
 *
 * <p>Resolution order:</p>
 * <ol>
 *   <li>If {@code families.created_by = userId} → ADMIN.</li>
 *   <li>If the user has a system-users row linked to them via family_members (any row),
 *       AND the latest accepted invitation for that user's email has a role → that role.</li>
 *   <li>Otherwise → default {@code VIEWER} so that listing families works for the
 *       creator's lookup even without invitations.</li>
 * </ol>
 *
 * <p>This keeps the logic off controllers and lets us surface a deterministic
 * role payload in {@code GET /api/families} and {@code GET /api/families/{id}}.</p>
 */
@Component
@RequiredArgsConstructor
public class FamilyRoleResolver {

    private final JdbcTemplate jdbc;
    private final FamilyInvitationRepository invitationRepository;

    public static final String ADMIN = "ADMIN";
    public static final String EDITOR = "EDITOR";
    public static final String VIEWER = "VIEWER";
    public static final String MEMBER = "MEMBER"; // generic, non-invitation link

    public boolean isCreator(UUID familyId, UUID userId) {
        Integer c = jdbc.queryForObject(
            "SELECT COUNT(*) FROM caygiaphaso.families WHERE id = ? AND created_by = ?",
            Integer.class, familyId, userId);
        return c != null && c > 0;
    }

    public boolean isMember(UUID familyId, UUID userId) {
        Integer c = jdbc.queryForObject(
            "SELECT COUNT(*) FROM caygiaphaso.family_members WHERE family_id = ? AND user_id = ?",
            Integer.class, familyId, userId);
        return c != null && c > 0;
    }

    public String resolveRole(UUID familyId, UUID userId, String email) {
        if (isCreator(familyId, userId)) {
            return ADMIN;
        }
        if (isMember(familyId, userId)) {
            // Use latest accepted invitation for the user's email, if any.
            if (email != null) {
                var inv = invitationRepository.findAcceptedRole(familyId, email);
                if (inv.isPresent() && inv.get().getRole() != null) {
                    return inv.get().getRole().name();
                }
            }
            return MEMBER; // generic member link
        }
        return null;       // not part of the family
    }

    public FamilyRole parseRoleOrDefault(String raw) {
        try {
            return FamilyRole.parse(raw);
        } catch (Exception e) {
            return FamilyRole.VIEWER;
        }
    }

    /** Convenience — accept a User entity or null. */
    public String resolveRole(UUID familyId, User user) {
        if (user == null) return null;
        return resolveRole(familyId, user.getId(), user.getEmail());
    }
}
