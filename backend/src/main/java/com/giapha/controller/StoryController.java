package com.giapha.controller;

import com.giapha.model.dto.story.CreateStoryRequest;
import com.giapha.model.dto.story.UpdateStoryRequest;
import com.giapha.service.StoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class StoryController {

    private final StoryService storyService;

    @GetMapping("/families/{familyId}/stories")
    public Map<String, Object> list(
            @PathVariable UUID familyId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID tag,
            @RequestParam(required = false) Boolean featured,
            @RequestParam(required = false) UUID memberId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        return storyService.list(familyId, search, tag, featured, memberId, page, size);
    }

    @PostMapping("/families/{familyId}/stories")
    public Map<String, Object> create(@PathVariable UUID familyId,
                                      @RequestBody CreateStoryRequest req) {
        return storyService.create(familyId, req);
    }

    @GetMapping("/stories/{storyId}")
    public Map<String, Object> get(@PathVariable UUID storyId) {
        return storyService.get(storyId);
    }

    @PutMapping("/stories/{storyId}")
    public Map<String, Object> update(@PathVariable UUID storyId,
                                      @RequestBody UpdateStoryRequest req) {
        return storyService.update(storyId, req);
    }

    @DeleteMapping("/stories/{storyId}")
    public Map<String, Object> delete(@PathVariable UUID storyId) {
        return storyService.delete(storyId);
    }
}