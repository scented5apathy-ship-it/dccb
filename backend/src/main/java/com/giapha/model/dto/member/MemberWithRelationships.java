package com.giapha.model.dto.member;

import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * Extends MemberDto with the immediate relationship graph:
 * parents / children / spouses. Used by GET /api/families/{id}/members and
 * GET /api/members/{memberId}.
 */
@Data
@Builder
public class MemberWithRelationships {
    private MemberDto member;
    private MemberSummary generation;
    private List<MemberSummary> parents;
    private List<MemberSummary> children;
    private List<MemberSummary> spouses;
    private List<MemberSummary> siblings;
}
