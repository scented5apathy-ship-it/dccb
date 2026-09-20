package com.giapha.controller;

import com.giapha.model.dto.story.CreateStoryRequest;
import com.giapha.model.dto.story.UpdateStoryRequest;
import com.giapha.service.StoryService;
import com.giapha.util.AuthorizationHelper;
import com.giapha.security.CustomUserDetails;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class StoryController {

    private final StoryService storyService;
    private final AuthorizationHelper authHelper;

    @GetMapping("/families/{familyId}/stories")
    public Map<String, Object> list(
            @PathVariable UUID familyId,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID tag,
            @RequestParam(required = false) Boolean featured,
            @RequestParam(required = false) UUID memberId,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @AuthenticationPrincipal CustomUserDetails currentUser
    ) {
        authHelper.requireFamilyMember(currentUser.getId(), familyId);
        return storyService.list(familyId, search, tag, featured, memberId, page, size);
    }

    @PostMapping("/families/{familyId}/stories")
    public Map<String, Object> create(@PathVariable UUID familyId,
                                      @Valid @RequestBody CreateStoryRequest req,
                                      @AuthenticationPrincipal CustomUserDetails currentUser) {
        authHelper.requireFamilyMember(currentUser.getId(), familyId);
        return storyService.create(familyId, req);
    }

    @GetMapping("/stories/{storyId}")
    public Map<String, Object> get(@PathVariable UUID storyId) {
        return storyService.get(storyId);
    }

    @PutMapping("/stories/{storyId}")
    public Map<String, Object> update(@PathVariable UUID storyId,
                                      @Valid @RequestBody UpdateStoryRequest req) {
        return storyService.update(storyId, req);
    }

    @DeleteMapping("/stories/{storyId}")
    public Map<String, Object> delete(@PathVariable UUID storyId) {
        return storyService.delete(storyId);
    }
}