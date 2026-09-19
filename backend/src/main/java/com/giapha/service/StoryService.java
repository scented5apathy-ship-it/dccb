package com.giapha.service;

import com.giapha.exception.BadRequestException;
import com.giapha.exception.ForbiddenException;
import com.giapha.exception.ResourceNotFoundException;
import com.giapha.model.dto.story.CreateStoryRequest;
import com.giapha.model.dto.story.UpdateStoryRequest;
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
public class StoryService {

    private final StoryRepository storyRepository;
    private final StoryMediaRepository storyMediaRepository;
    private final StoryTagRepository storyTagRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;
    private final AuthorizationHelper authz;
    private final CurrentUser currentUser;
    private final JdbcTemplate jdbc;

    private static final int MAX_PAGE_SIZE = 100;

    public Map<String, Object> list(UUID familyId, String search, UUID tagId, Boolean featured,
                                    UUID memberId, Integer page, Integer size) {
        authz.requireFamilyMember(currentUser.getCurrentUserId(), familyId);
        int p = page == null ? 0 : Math.max(page, 0);
        int s = size == null ? 20 : Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        int offset = p * s;

        List<Story> stories = storyRepository.list(familyId, search, tagId, featured, memberId, s, offset);
        int total = storyRepository.count(familyId, search, tagId, featured, memberId);

        List<Map<String, Object>> items = new ArrayList<>();
        for (Story st : stories) {
            int mediaCount = storyMediaRepository.countByStoryId(st.getId());
            List<StoryTag> tags = storyTagRepository.listByStoryId(st.getId());
            User author = userRepository.findById(st.getAuthorId()).orElse(null);
            items.add(Map.of(
                "story", st,
                "author", author == null ? null : Map.of(
                    "id", author.getId(),
                    "fullName", author.getFullName(),
                    "avatarUrl", author.getAvatarUrl()
                ),
                "mediaCount", mediaCount,
                "tags", tags.stream().map(StoryTag::getName).toList()
            ));
        }

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("stories", items);
        out.put("total", total);
        out.put("page", p);
        out.put("size", s);
        return out;
    }

    @Transactional
    public Map<String, Object> create(UUID familyId, CreateStoryRequest req) {
        UUID userId = currentUser.getCurrentUserId();
        authz.requireFamilyMember(userId, familyId);

        if (req.getTitle() == null || req.getTitle().isBlank()) {
            throw new BadRequestException("Title không được trống");
        }

        Story s = Story.builder()
            .familyId(familyId)
            .authorId(userId)
            .title(req.getTitle())
            .content(req.getContent())
            .storyDate(req.getStoryDate())
            .storyLocation(req.getStoryLocation())
            .relatedMemberIds(req.getRelatedMemberIds() == null ? List.of() : req.getRelatedMemberIds())
            .relatedGenerationId(req.getRelatedGenerationId())
            .isFeatured(Boolean.TRUE.equals(req.getIsFeatured()))
            .viewCount(0)
            .build();

        if (req.getRelatedMemberIds() != null && !req.getRelatedMemberIds().isEmpty()) {
            UUID[] ids = req.getRelatedMemberIds().toArray(new UUID[0]);
            Integer validCount = jdbc.queryForObject(
                "SELECT COUNT(*) FROM caygiaphaso.family_members WHERE family_id = ? AND id = ANY(?)",
                Integer.class, familyId, ids);
            if (validCount == null || validCount != req.getRelatedMemberIds().size()) {
                throw new BadRequestException("Một số thành viên được gắn thẻ không thuộc gia tộc này");
            }
        }

        UUID storyId = storyRepository.insert(s);

        List<StoryMedia> mediaList = new ArrayList<>();
        if (req.getMedia() != null) {
            int idx = 0;
            for (var m : req.getMedia()) {
                if (m.getMediaUrl() == null || m.getMediaUrl().isBlank()) continue;
                UUID id = storyMediaRepository.insert(storyId, m.getMediaType(), m.getMediaUrl(), m.getCaption(), idx);
                mediaList.add(StoryMedia.builder()
                    .id(id).storyId(storyId).mediaType(m.getMediaType())
                    .mediaUrl(m.getMediaUrl()).caption(m.getCaption()).orderIndex(idx)
                    .build());
                idx++;
            }
        }

        List<StoryTag> tags = new ArrayList<>();
        if (req.getTagIds() != null && !req.getTagIds().isEmpty()) {
            for (UUID tagId : req.getTagIds()) {
                storyTagRepository.findById(tagId).ifPresent(tags::add);
            }
            storyTagRepository.attachTagsToStory(storyId, req.getTagIds());
        }

        notifyTaggedMembers(storyId, familyId, req.getRelatedMemberIds(), userId);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("story", s);
        result.put("media", mediaList);
        result.put("tags", tags);
        return result;
    }

    private void notifyTaggedMembers(UUID storyId, UUID familyId, List<UUID> memberIds, UUID authorId) {
        if (memberIds == null || memberIds.isEmpty()) return;
        for (UUID memberId : memberIds) {
            try {
                UUID userId = jdbc.queryForObject(
                    "SELECT user_id FROM caygiaphaso.family_members WHERE id = ?",
                    UUID.class, memberId);
                if (userId == null || userId.equals(authorId)) continue;
                notificationRepository.insert(Notification.builder()
                    .userId(userId)
                    .notificationType("STORY_TAGGED")
                    .title("Bạn được nhắc đến trong một câu chuyện")
                    .content("Một thành viên trong gia đình đã nhắc đến bạn trong một câu chuyện.")
                    .relatedEntityType("STORY")
                    .relatedEntityId(storyId)
                    .build());
            } catch (Exception ignore) {}
        }
    }

    @Transactional
    public Map<String, Object> get(UUID storyId) {
        Story s = storyRepository.findById(storyId)
            .orElseThrow(() -> new ResourceNotFoundException("Story", storyId.toString()));
        authz.requireFamilyMember(currentUser.getCurrentUserId(), s.getFamilyId());

        storyRepository.incrementViewCount(storyId);

        List<StoryMedia> media = storyMediaRepository.findByStoryId(storyId);
        List<StoryTag> tags = storyTagRepository.listByStoryId(storyId);
        User author = userRepository.findById(s.getAuthorId()).orElse(null);
        Map<String, Object> authorSummary = author == null ? null : Map.of(
            "id", author.getId(),
            "fullName", author.getFullName(),
            "avatarUrl", author.getAvatarUrl()
        );

        List<Map<String, Object>> comments = jdbc.query(
            "SELECT c.id, c.content, c.created_at, c.user_id, u.full_name, u.avatar_url " +
            "FROM caygiaphaso.comments c JOIN caygiaphaso.users u ON u.id = c.user_id " +
            "WHERE c.entity_type = 'STORY' AND c.entity_id = ? ORDER BY c.created_at DESC",
            (rs, n) -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id", rs.getObject("id"));
                m.put("content", rs.getString("content"));
                m.put("createdAt", rs.getObject("created_at"));
                m.put("userId", rs.getObject("user_id"));
                m.put("userName", rs.getString("full_name"));
                m.put("userAvatar", rs.getString("avatar_url"));
                return m;
            }, storyId);

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("story", s);
        out.put("author", authorSummary);
        out.put("media", media);
        out.put("tags", tags);
        out.put("comments", comments);
        return out;
    }

    @Transactional
    public Map<String, Object> update(UUID storyId, UpdateStoryRequest req) {
        Story s = storyRepository.findById(storyId)
            .orElseThrow(() -> new ResourceNotFoundException("Story", storyId.toString()));
        UUID userId = currentUser.getCurrentUserId();

        boolean isAuthor = s.getAuthorId().equals(userId);
        boolean isFamilyAdmin = authz.isFamilyAdmin(userId, s.getFamilyId());
        if (!isAuthor && !isFamilyAdmin) {
            throw new ForbiddenException("Chỉ tác giả hoặc ADMIN mới có thể chỉnh sửa");
        }

        storyRepository.update(
            storyId,
            req.getTitle() != null ? req.getTitle() : s.getTitle(),
            req.getContent() != null ? req.getContent() : s.getContent(),
            req.getStoryDate() != null ? req.getStoryDate() : s.getStoryDate(),
            req.getStoryLocation() != null ? req.getStoryLocation() : s.getStoryLocation(),
            req.getRelatedGenerationId() != null ? req.getRelatedGenerationId() : s.getRelatedGenerationId(),
            req.getIsFeatured() != null ? req.getIsFeatured() : s.getIsFeatured(),
            req.getRelatedMemberIds() != null ? req.getRelatedMemberIds() : s.getRelatedMemberIds()
        );

        Story updated = storyRepository.findById(storyId).orElseThrow();
        return Map.of("story", updated);
    }

    @Transactional
    public Map<String, Object> delete(UUID storyId) {
        Story s = storyRepository.findById(storyId)
            .orElseThrow(() -> new ResourceNotFoundException("Story", storyId.toString()));
        UUID userId = currentUser.getCurrentUserId();

        boolean isAuthor = s.getAuthorId().equals(userId);
        boolean isFamilyAdmin = authz.isFamilyAdmin(userId, s.getFamilyId());
        if (!isAuthor && !isFamilyAdmin) {
            throw new ForbiddenException("Chỉ tác giả hoặc ADMIN mới có thể xoá");
        }
        storyRepository.delete(storyId);
        return Map.of("message", "Story deleted");
    }

    public Map<String, Object> listTags() {
        List<StoryTag> tags = storyTagRepository.listAll();
        List<Map<String, Object>> items = new ArrayList<>();
        for (StoryTag t : tags) {
            items.add(Map.of(
                "tag", t,
                "storyCount", storyTagRepository.countStoriesByTag(t.getId())
            ));
        }
        return Map.of("tags", items);
    }

    @Transactional
    public Map<String, Object> createTag(String name) {
        if (name == null || name.isBlank()) {
            throw new BadRequestException("Tên tag không được trống");
        }
        UUID id = storyTagRepository.upsertByName(name.trim());
        StoryTag tag = storyTagRepository.findById(id).orElseThrow();
        return Map.of("tag", tag);
    }
}