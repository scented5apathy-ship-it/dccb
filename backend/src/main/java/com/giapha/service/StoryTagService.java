package com.giapha.service;

import com.giapha.model.dto.story.CreateStoryTagRequest;
import com.giapha.model.entity.StoryTag;
import com.giapha.repository.StoryTagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class StoryTagService {

    private final StoryTagRepository storyTagRepository;

    public Map<String, Object> list() {
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
    public Map<String, Object> create(CreateStoryTagRequest req) {
        UUID id = storyTagRepository.upsertByName(req.getName().trim());
        StoryTag tag = storyTagRepository.findById(id).orElseThrow();
        return Map.of("tag", tag);
    }
}