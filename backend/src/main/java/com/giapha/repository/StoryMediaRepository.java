package com.giapha.repository;

import com.giapha.model.entity.StoryMedia;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public class StoryMediaRepository {

    private final JdbcTemplate jdbc;

    public StoryMediaRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private static final RowMapper<StoryMedia> ROW_MAPPER = (rs, n) -> {
        StoryMedia m = new StoryMedia();
        m.setId((UUID) rs.getObject("id"));
        m.setStoryId((UUID) rs.getObject("story_id"));
        m.setMediaType(rs.getString("media_type"));
        m.setMediaUrl(rs.getString("media_url"));
        m.setCaption(rs.getString("caption"));
        m.setOrderIndex(rs.getInt("order_index"));
        m.setUploadedAt(rs.getObject("uploaded_at", OffsetDateTime.class));
        return m;
    };

    public UUID insert(UUID storyId, String mediaType, String mediaUrl, String caption, int orderIndex) {
        UUID id = UUID.randomUUID();
        jdbc.update(
            "INSERT INTO caygiaphaso.story_media " +
            "(id, story_id, media_type, media_url, caption, order_index) VALUES (?, ?, ?, ?, ?, ?)",
            id, storyId, mediaType, mediaUrl, caption, orderIndex
        );
        return id;
    }

    public List<StoryMedia> findByStoryId(UUID storyId) {
        return jdbc.query(
            "SELECT * FROM caygiaphaso.story_media WHERE story_id = ? ORDER BY order_index",
            ROW_MAPPER, storyId);
    }

    public void deleteByStoryId(UUID storyId) {
        jdbc.update("DELETE FROM caygiaphaso.story_media WHERE story_id = ?", storyId);
    }

    public int countByStoryId(UUID storyId) {
        Integer c = jdbc.queryForObject(
            "SELECT COUNT(*) FROM caygiaphaso.story_media WHERE story_id = ?",
            Integer.class, storyId);
        return c == null ? 0 : c;
    }
}