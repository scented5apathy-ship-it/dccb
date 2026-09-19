package com.giapha.controller;

import com.giapha.model.dto.album.AddPhotoRequest;
import com.giapha.model.dto.album.CreateAlbumRequest;
import com.giapha.service.PhotoAlbumService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class PhotoAlbumController {

    private final PhotoAlbumService photoAlbumService;

    @GetMapping("/families/{familyId}/albums")
    public Map<String, Object> listAlbums(@PathVariable UUID familyId) {
        return photoAlbumService.listAlbums(familyId);
    }

    @PostMapping("/families/{familyId}/albums")
    public Map<String, Object> createAlbum(@PathVariable UUID familyId,
                                           @RequestBody CreateAlbumRequest req) {
        return photoAlbumService.createAlbum(familyId, req);
    }

    @GetMapping("/albums/{albumId}/photos")
    public Map<String, Object> listPhotos(@PathVariable UUID albumId) {
        return photoAlbumService.listPhotos(albumId);
    }

    @PostMapping("/albums/{albumId}/photos")
    public Map<String, Object> addPhoto(@PathVariable UUID albumId,
                                        @RequestBody AddPhotoRequest req) {
        return photoAlbumService.addPhoto(albumId, req);
    }
}