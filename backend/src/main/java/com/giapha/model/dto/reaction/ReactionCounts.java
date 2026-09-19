package com.giapha.model.dto.reaction;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * Snapshot of how users have reacted to a recipe:
 *  - counts: aggregate bucket per reaction type
 *  - users:  optional per-user listing (used by the GET endpoint)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReactionCounts {
    private long like;
    private long love;
    private long yum;
    private long wantToTry;

    private List<UserReaction> users;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserReaction {
        private UUID userId;
        private String fullName;
        private String avatarUrl;
        private String reactionType;
    }
}