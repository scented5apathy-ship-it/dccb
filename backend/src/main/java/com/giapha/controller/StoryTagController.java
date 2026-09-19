package com.giapha.controller;

import com.giapha.model.dto.story.CreateStoryTagRequest;
import com.giapha.service.StoryTagService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class StoryTagController {

    private final StoryTagService storyTagService;

    @GetMapping("/story-tags")
    public Map<String, Object> list() {
        return storyTagService.list();
    }

    @PostMapping("/story-tags")
    public Map<String, Object> create(@RequestBody CreateStoryTagRequest req) {
        return storyTagService.create(req);
    }
}