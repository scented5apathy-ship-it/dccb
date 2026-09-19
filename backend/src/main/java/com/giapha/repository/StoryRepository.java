package com.giapha.repository;

import com.giapha.model.entity.Story;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.Array;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class StoryRepository {

    private final JdbcTemplate jdbc;

    @Autowired
    public StoryRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private static final RowMapper<Story> ROW_MAPPER = (rs, n) -> {
        Story s = new Story();
        s.setId((UUID) rs.getObject("id"));
        s.setFamilyId((UUID) rs.getObject("family_id"));
        s.setAuthorId((UUID) rs.getObject("author_id"));
        s.setTitle(rs.getString("title"));
        s.setContent(rs.getString("content"));
        s.setStoryDate(rs.getObject("story_date", java.time.LocalDate.class));
        s.setStoryLocation(rs.getString("story_location"));
        Array memberArr = rs.getArray("related_member_ids");
        List<UUID> memberIds = new ArrayList<>();
        if (memberArr != null) {
            Object[] arr = (Object[]) memberArr.getArray();
            for (Object o : arr) {
                if (o != null) memberIds.add((UUID) o);
            }
        }
        s.setRelatedMemberIds(memberIds);
        s.setRelatedGenerationId((UUID) rs.getObject("related_generation_id"));
        s.setIsFeatured(rs.getBoolean("is_featured"));
        s.setViewCount(rs.getInt("view_count"));
        s.setCreatedAt(rs.getObject("created_at", OffsetDateTime.class));
        s.setUpdatedAt(rs.getObject("updated_at", OffsetDateTime.class));
        return s;
    };

    public UUID insert(Story s) {
        UUID id = s.getId() != null ? s.getId() : UUID.randomUUID();
        String memberArrLit = s.getRelatedMemberIds() == null || s.getRelatedMemberIds().isEmpty()
            ? "'{}'" : "'" + toPgUuidArray(s.getRelatedMemberIds()) + "'";
        jdbc.update(
            "INSERT INTO caygiaphaso.stories " +
            "(id, family_id, author_id, title, content, story_date, story_location, " +
            " related_member_ids, related_generation_id, is_featured, view_count) " +
            "VALUES (?, ?, ?, ?, ?, ?, ?, " + memberArrLit + "::uuid[], ?, ?, ?)",
            id, s.getFamilyId(), s.getAuthorId(), s.getTitle(), s.getContent(),
            s.getStoryDate(), s.getStoryLocation(),
            s.getRelatedGenerationId(), Boolean.TRUE.equals(s.getIsFeatured()), 0
        );
        return id;
    }

    public Optional<Story> findById(UUID id) {
        List<Story> rows = jdbc.query(
            "SELECT * FROM caygiaphaso.stories WHERE id = ?", ROW_MAPPER, id);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    public void update(UUID id, String title, String content, java.time.LocalDate storyDate,
                       String storyLocation, UUID relatedGenerationId, Boolean isFeatured,
                       List<UUID> relatedMemberIds) {
        String memberArrLit = relatedMemberIds == null || relatedMemberIds.isEmpty()
            ? "'{}'" : "'" + toPgUuidArray(relatedMemberIds) + "'";
        jdbc.update(
            "UPDATE caygiaphaso.stories SET title = ?, content = ?, story_date = ?, " +
            "story_location = ?, related_member_ids = " + memberArrLit + "::uuid[], " +
            "related_generation_id = ?, is_featured = ? WHERE id = ?",
            title, content, storyDate, storyLocation,
            relatedGenerationId, Boolean.TRUE.equals(isFeatured), id
        );
    }

    public void delete(UUID id) {
        jdbc.update("DELETE FROM caygiaphaso.stories WHERE id = ?", id);
    }

    public void incrementViewCount(UUID id) {
        jdbc.update("UPDATE caygiaphaso.stories SET view_count = view_count + 1 WHERE id = ?", id);
    }

    /**
     * List stories for a family with optional filters. search/title and tagId
     * filters translate to extra WHERE clauses; pagination via LIMIT/OFFSET.
     */
    public List<Story> list(UUID familyId, String search, UUID tagId, Boolean featured,
                            UUID memberId, int limit, int offset) {
        StringBuilder sql = new StringBuilder(
            "SELECT s.* FROM caygiaphaso.stories s ");
        List<Object> args = new ArrayList<>();
        List<String> where = new ArrayList<>();
        where.add("s.family_id = ?");
        args.add(familyId);
        if (search != null && !search.isBlank()) {
            where.add("(LOWER(s.title) LIKE ? OR LOWER(s.content) LIKE ?)");
            String like = "%" + search.toLowerCase() + "%";
            args.add(like); args.add(like);
        }
        if (Boolean.TRUE.equals(featured)) {
            where.add("s.is_featured = TRUE");
        }
        if (memberId != null) {
            where.add("? = ANY(s.related_member_ids)");
            args.add(memberId);
        }
        if (tagId != null) {
            sql.append("JOIN caygiaphaso.story_tag_map m ON m.story_id = s.id ");
            where.add("m.tag_id = ?");
            args.add(tagId);
        }
        if (!where.isEmpty()) {
            sql.append("WHERE ").append(String.join(" AND ", where)).append(' ');
        }
        sql.append("ORDER BY s.is_featured DESC, s.created_at DESC LIMIT ? OFFSET ?");
        args.add(limit);
        args.add(offset);
        return jdbc.query(sql.toString(), ROW_MAPPER, args.toArray());
    }

    public int count(UUID familyId, String search, UUID tagId, Boolean featured, UUID memberId) {
        StringBuilder sql = new StringBuilder("SELECT COUNT(*) FROM caygiaphaso.stories s ");
        List<Object> args = new ArrayList<>();
        List<String> where = new ArrayList<>();
        where.add("s.family_id = ?");
        args.add(familyId);
        if (search != null && !search.isBlank()) {
            where.add("(LOWER(s.title) LIKE ? OR LOWER(s.content) LIKE ?)");
            String like = "%" + search.toLowerCase() + "%";
            args.add(like); args.add(like);
        }
        if (Boolean.TRUE.equals(featured)) {
            where.add("s.is_featured = TRUE");
        }
        if (memberId != null) {
            where.add("? = ANY(s.related_member_ids)");
            args.add(memberId);
        }
        if (tagId != null) {
            sql.append("JOIN caygiaphaso.story_tag_map m ON m.story_id = s.id ");
            where.add("m.tag_id = ?");
            args.add(tagId);
        }
        if (!where.isEmpty()) sql.append("WHERE ").append(String.join(" AND ", where));
        Integer c = jdbc.queryForObject(sql.toString(), Integer.class, args.toArray());
        return c == null ? 0 : c;
    }

    private static String toPgUuidArray(List<UUID> ids) {
        StringBuilder sb = new StringBuilder("{");
        for (int i = 0; i < ids.size(); i++) {
            if (i > 0) sb.append(',');
            sb.append(ids.get(i).toString());
        }
        sb.append('}');
        return sb.toString();
    }
}