package com.giapha.repository;

import com.giapha.model.entity.Photo;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.sql.Array;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Repository
public class PhotoRepository {

    private final JdbcTemplate jdbc;

    public PhotoRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    private static final RowMapper<Photo> ROW_MAPPER = (rs, n) -> {
        Photo p = new Photo();
        p.setId((UUID) rs.getObject("id"));
        p.setAlbumId((UUID) rs.getObject("album_id"));
        p.setUploaderId((UUID) rs.getObject("uploader_id"));
        p.setPhotoUrl(rs.getString("photo_url"));
        p.setCaption(rs.getString("caption"));
        p.setPhotoDate(rs.getObject("photo_date", LocalDate.class));
        p.setPhotoLocation(rs.getString("photo_location"));
        Array memberArr = rs.getArray("member_ids");
        List<UUID> memberIds = new ArrayList<>();
        if (memberArr != null) {
            Object[] arr = (Object[]) memberArr.getArray();
            for (Object o : arr) if (o != null) memberIds.add((UUID) o);
        }
        p.setMemberIds(memberIds);
        p.setCreatedAt(rs.getObject("created_at", OffsetDateTime.class));
        return p;
    };

    public UUID insert(UUID albumId, UUID uploaderId, String photoUrl, String caption,
                       LocalDate photoDate, String photoLocation, List<UUID> memberIds) {
        UUID id = UUID.randomUUID();
        String memberArr = memberIds == null || memberIds.isEmpty()
            ? "{}" : toPgUuidArray(memberIds);
        jdbc.update(
            "INSERT INTO caygiaphaso.photos " +
            "(id, album_id, uploader_id, photo_url, caption, photo_date, photo_location, member_ids) " +
            "VALUES (?, ?, ?, ?, ?, ?, ?, " + memberArr + "::uuid[])",
            id, albumId, uploaderId, photoUrl, caption, photoDate, photoLocation);
        return id;
    }

    public List<Photo> listByAlbum(UUID albumId) {
        return jdbc.query(
            "SELECT * FROM caygiaphaso.photos WHERE album_id = ? ORDER BY photo_date DESC NULLS LAST, created_at DESC",
            ROW_MAPPER, albumId);
    }

    public List<UUID> taggedMemberIds(UUID photoId) {
        return jdbc.query(
            "SELECT tagged_member_id FROM caygiaphaso.photo_tags " +
            "WHERE photo_id = ? AND tag_type = 'MEMBER' AND tagged_member_id IS NOT NULL",
            (rs, n) -> (UUID) rs.getObject(1), photoId);
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