package com.giapha.service;

import com.giapha.exception.ResourceNotFoundException;
import com.giapha.model.dto.album.AddPhotoRequest;
import com.giapha.model.dto.album.CreateAlbumRequest;
import com.giapha.model.dto.common.UserSummary;
import com.giapha.model.entity.*;
import com.giapha.repository.*;
import com.giapha.security.CurrentUser;
import com.giapha.util.AuthorizationHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class PhotoAlbumService {

    private final PhotoAlbumRepository albumRepository;
    private final PhotoRepository photoRepository;
    private final UserRepository userRepository;
    private final AuthorizationHelper authz;
    private final CurrentUser currentUser;
    private final JdbcTemplate jdbc;

    public Map<String, Object> listAlbums(UUID familyId) {
        authz.requireFamilyMember(currentUser.getCurrentUserId(), familyId);

        List<PhotoAlbum> albums = albumRepository.listByFamily(familyId);
        List<Map<String, Object>> items = new ArrayList<>();
        for (PhotoAlbum a : albums) {
            User creator = userRepository.findById(a.getCreatorId()).orElse(null);
            int photoCount = albumRepository.countPhotos(a.getId());
            items.add(Map.of(
                "album", a,
                "creator", creator == null ? null : Map.of(
                    "id", creator.getId(),
                    "fullName", creator.getFullName(),
                    "avatarUrl", creator.getAvatarUrl()
                ),
                "photoCount", photoCount,
                "coverPhoto", a.getCoverPhotoUrl()
            ));
        }
        return Map.of("albums", items);
    }

    @Transactional
    public Map<String, Object> createAlbum(UUID familyId, CreateAlbumRequest req) {
        UUID userId = currentUser.getCurrentUserId();
        authz.requireFamilyMember(userId, familyId);

        PhotoAlbum album = PhotoAlbum.builder()
            .familyId(familyId)
            .creatorId(userId)
            .title(req.getTitle())
            .description(req.getDescription())
            .coverPhotoUrl(req.getCoverPhotoUrl())
            .build();
        UUID id = albumRepository.insert(album);
        PhotoAlbum saved = albumRepository.findById(id).orElseThrow();
        return Map.of("album", saved);
    }

    public Map<String, Object> listPhotos(UUID albumId) {
        PhotoAlbum album = albumRepository.findById(albumId)
            .orElseThrow(() -> new ResourceNotFoundException("Album", albumId.toString()));
        authz.requireFamilyMember(currentUser.getCurrentUserId(), album.getFamilyId());

        List<Photo> photos = photoRepository.listByAlbum(albumId);
        Map<UUID, User> uploaders = new HashMap<>();
        Map<UUID, List<UUID>> taggedByPhoto = new HashMap<>();
        Map<UUID, List<UserSummary>> taggedMembersByPhoto = new HashMap<>();
        for (Photo p : photos) {
            userRepository.findById(p.getUploaderId()).ifPresent(u -> uploaders.put(p.getUploaderId(), u));
            List<UUID> taggedIds = photoRepository.taggedMemberIds(p.getId());
            taggedByPhoto.put(p.getId(), taggedIds);
            // Also merge any IDs encoded in the photos.member_ids array for a more complete picture
            if (p.getMemberIds() != null) {
                for (UUID m : p.getMemberIds()) {
                    if (!taggedIds.contains(m)) taggedIds.add(m);
                }
            }
            taggedMembersByPhoto.put(p.getId(), fetchMemberSummaries(taggedIds));
        }

        List<Map<String, Object>> items = new ArrayList<>();
        for (Photo p : photos) {
            User u = uploaders.get(p.getUploaderId());
            items.add(Map.of(
                "photo", p,
                "uploader", u == null ? null : Map.of(
                    "id", u.getId(), "fullName", u.getFullName(), "avatarUrl", u.getAvatarUrl()
                ),
                "taggedMembers", taggedMembersByPhoto.getOrDefault(p.getId(), List.of())
            ));
        }
        return Map.of("photos", items);
    }

    @Transactional
    public Map<String, Object> addPhoto(UUID albumId, AddPhotoRequest req) {
        PhotoAlbum album = albumRepository.findById(albumId)
            .orElseThrow(() -> new ResourceNotFoundException("Album", albumId.toString()));
        UUID userId = currentUser.getCurrentUserId();
        authz.requireFamilyMember(userId, album.getFamilyId());

        UUID id = photoRepository.insert(
            albumId, userId, req.getPhotoUrl(), req.getCaption(),
            req.getPhotoDate(), req.getPhotoLocation(),
            req.getMemberIds() == null ? List.of() : req.getMemberIds()
        );

        // Persist photo_tags rows so member lookups in listPhotos are consistent
        if (req.getMemberIds() != null) {
            for (UUID memberId : req.getMemberIds()) {
                try {
                    jdbc.update(
                        "INSERT INTO caygiaphaso.photo_tags (id, photo_id, tag_type, tagged_member_id) " +
                        "VALUES (?, ?, 'MEMBER', ?)",
                        UUID.randomUUID(), id, memberId);
                } catch (Exception ignore) {}
            }
        }

        Photo saved = photoRepository.listByAlbum(albumId).stream()
            .filter(p -> p.getId().equals(id)).findFirst().orElseThrow();
        return Map.of("photo", saved);
    }

    private List<UserSummary> fetchMemberSummaries(List<UUID> memberIds) {
        if (memberIds.isEmpty()) return List.of();
        StringBuilder sql = new StringBuilder(
            "SELECT id, full_name FROM caygiaphaso.family_members WHERE id IN (");
        for (int i = 0; i < memberIds.size(); i++) {
            if (i > 0) sql.append(',');
            sql.append('?');
        }
        sql.append(')');
        return jdbc.query(sql.toString(),
            (rs, n) -> UserSummary.builder()
                .id((UUID) rs.getObject(1))
                .fullName(rs.getString(2))
                .build(),
            memberIds.toArray());
    }
}