package com.giapha.model.dto.origin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

/**
 * Full genealogy tree for a recipe - the novel feature of CâyGiaPhảSố.
 *
 * The response tells the story of how a recipe travelled through generations:
 * which family member originated it, who they passed it to, and so on.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GenealogyTreeResponse {
    private RecipeRef recipe;
    private TreeNode tree;
    private int totalGenerations;
    private Integer oldestYear;
    private Integer newestYear;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecipeRef {
        private UUID id;
        private String title;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TreeNode {
        private MemberRef member;
        private Integer year;
        private String story;
        private List<TreeNode> children;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MemberRef {
        private UUID id;
        private String fullName;
        private Integer generationNumber;
        private String generationName;
    }
}