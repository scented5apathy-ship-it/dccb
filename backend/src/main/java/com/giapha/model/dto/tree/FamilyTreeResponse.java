package com.giapha.model.dto.tree;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

/**
 * Output of GET /api/families/{familyId}/tree.
 *
 * <p>Each top-level member carries pre-rendered {@code spouses}, {@code siblings},
 * and a recursive {@code children} list — the frontend can walk this directly
 * to render a hierarchical tree.</p>
 */
@Data
@Builder
public class FamilyTreeResponse {

    private UUID familyId;
    private String familyName;
    private Integer totalMembers;
    private Integer totalGenerations;
    private List<GenerationNode> generations;

    @Data
    @Builder
    public static class GenerationNode {
        private UUID id;
        private Integer generationNumber;
        private String name;
        private Integer startYear;
        private Integer endYear;
        private List<TreeMemberNode> members;
    }

    @Data
    @Builder
    public static class TreeMemberNode {
        private UUID id;
        private UUID familyId;
        private String fullName;
        private String nickname;
        private String gender;
        private String avatarUrl;
        private java.time.LocalDate birthDate;
        private java.time.LocalDate deathDate;
        private Boolean isAlive;
        private String occupation;
        private UUID generationId;
        private List<TreeMemberNode> spouses;     // direct spouses (no recursion)
        private List<TreeMemberNode> siblings;    // siblings in same generation
        private List<TreeMemberNode> children;    // recursive
    }
}
