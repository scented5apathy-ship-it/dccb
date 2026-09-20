package com.giapha.controller;

import com.giapha.model.dto.album.AddPhotoRequest;
import com.giapha.model.dto.album.CreateAlbumRequest;
import com.giapha.security.CustomUserDetails;
import com.giapha.service.PhotoAlbumService;
import com.giapha.util.AuthorizationHelper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class PhotoAlbumController {

    private final PhotoAlbumService photoAlbumService;
    private final AuthorizationHelper authHelper;

    @GetMapping("/families/{familyId}/albums")
    public Map<String, Object> listAlbums(@PathVariable UUID familyId,
                                          @AuthenticationPrincipal CustomUserDetails currentUser) {
        authHelper.requireFamilyMember(currentUser.getId(), familyId);
        return photoAlbumService.listAlbums(familyId);
    }

    @PostMapping("/families/{familyId}/albums")
    public Map<String, Object> createAlbum(@PathVariable UUID familyId,
                                           @Valid @RequestBody CreateAlbumRequest req,
                                           @AuthenticationPrincipal CustomUserDetails currentUser) {
        authHelper.requireFamilyMember(currentUser.getId(), familyId);
        return photoAlbumService.createAlbum(familyId, req);
    }

    @GetMapping("/albums/{albumId}/photos")
    public Map<String, Object> listPhotos(@PathVariable UUID albumId) {
        return photoAlbumService.listPhotos(albumId);
    }

    @PostMapping("/albums/{albumId}/photos")
    public Map<String, Object> addPhoto(@PathVariable UUID albumId,
                                        @Valid @RequestBody AddPhotoRequest req) {
        return photoAlbumService.addPhoto(albumId, req);
    }
}