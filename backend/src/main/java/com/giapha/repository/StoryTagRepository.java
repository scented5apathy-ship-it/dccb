package com.giapha.repository;

import com.giapha.model.entity.StoryTag;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class StoryTagRepository {

    private final JdbcTemplate jdbc;

    public StoryTagRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private static final RowMapper<StoryTag> ROW_MAPPER = (rs, n) -> {
        StoryTag t = new StoryTag();
        t.setId((UUID) rs.getObject("id"));
        t.setName(rs.getString("name"));
        t.setCreatedAt(rs.getObject("created_at", OffsetDateTime.class));
        return t;
    };

    public UUID upsertByName(String name) {
        try {
            UUID id = jdbc.queryForObject(
                "SELECT id FROM caygiaphaso.story_tags WHERE LOWER(name) = LOWER(?)",
                UUID.class, name);
            return id;
        } catch (EmptyResultDataAccessException e) {
            UUID id = UUID.randomUUID();
            jdbc.update(
                "INSERT INTO caygiaphaso.story_tags (id, name) VALUES (?, ?)", id, name);
            return id;
        }
    }

    public List<StoryTag> listAll() {
        return jdbc.query("SELECT * FROM caygiaphaso.story_tags ORDER BY name", ROW_MAPPER);
    }

    public List<StoryTag> listByStoryId(UUID storyId) {
        return jdbc.query(
            "SELECT st.* FROM caygiaphaso.story_tags st " +
            "JOIN caygiaphaso.story_tag_map m ON m.tag_id = st.id " +
            "WHERE m.story_id = ? ORDER BY st.name",
            ROW_MAPPER, storyId);
    }

    public void attachTagsToStory(UUID storyId, List<UUID> tagIds) {
        if (tagIds == null) return;
        for (UUID tagId : tagIds) {
            try {
                jdbc.update(
                    "INSERT INTO caygiaphaso.story_tag_map (id, story_id, tag_id) VALUES (?, ?, ?)",
                    UUID.randomUUID(), storyId, tagId);
            } catch (Exception ignore) {
                // unique violation already attached, skip
            }
        }
    }

    public void deleteByStoryId(UUID storyId) {
        jdbc.update("DELETE FROM caygiaphaso.story_tag_map WHERE story_id = ?", storyId);
    }

    public int countStoriesByTag(UUID tagId) {
        Integer c = jdbc.queryForObject(
            "SELECT COUNT(*) FROM caygiaphaso.story_tag_map WHERE tag_id = ?",
            Integer.class, tagId);
        return c == null ? 0 : c;
    }

    public Optional<StoryTag> findById(UUID id) {
        List<StoryTag> rows = jdbc.query(
            "SELECT * FROM caygiaphaso.story_tags WHERE id = ?", ROW_MAPPER, id);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }
}