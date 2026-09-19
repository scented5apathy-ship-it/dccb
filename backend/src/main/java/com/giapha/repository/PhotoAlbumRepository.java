package com.giapha.repository;

import com.giapha.model.entity.PhotoAlbum;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public class PhotoAlbumRepository {

    private final JdbcTemplate jdbc;

    public PhotoAlbumRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private static final RowMapper<PhotoAlbum> ROW_MAPPER = (rs, n) -> {
        PhotoAlbum a = new PhotoAlbum();
        a.setId((UUID) rs.getObject("id"));
        a.setFamilyId((UUID) rs.getObject("family_id"));
        a.setCreatorId((UUID) rs.getObject("creator_id"));
        a.setTitle(rs.getString("title"));
        a.setDescription(rs.getString("description"));
        a.setCoverPhotoUrl(rs.getString("cover_photo_url"));
        a.setCreatedAt(rs.getObject("created_at", OffsetDateTime.class));
        return a;
    };

    public UUID insert(PhotoAlbum a) {
        UUID id = UUID.randomUUID();
        jdbc.update(
            "INSERT INTO caygiaphaso.photo_albums (id, family_id, creator_id, title, description, cover_photo_url) " +
            "VALUES (?, ?, ?, ?, ?, ?)",
            id, a.getFamilyId(), a.getCreatorId(), a.getTitle(), a.getDescription(), a.getCoverPhotoUrl());
        return id;
    }

    public Optional<PhotoAlbum> findById(UUID id) {
        List<PhotoAlbum> rows = jdbc.query(
            "SELECT * FROM caygiaphaso.photo_albums WHERE id = ?", ROW_MAPPER, id);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    public List<PhotoAlbum> listByFamily(UUID familyId) {
        return jdbc.query(
            "SELECT * FROM caygiaphaso.photo_albums WHERE family_id = ? ORDER BY created_at DESC",
            ROW_MAPPER, familyId);
    }

    public int countPhotos(UUID albumId) {
        Integer c = jdbc.queryForObject(
            "SELECT COUNT(*) FROM caygiaphaso.photos WHERE album_id = ?",
            Integer.class, albumId);
        return c == null ? 0 : c;
    }
}