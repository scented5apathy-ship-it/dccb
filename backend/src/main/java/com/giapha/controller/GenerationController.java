package com.giapha.controller;

import com.giapha.model.dto.common.MessageResponse;
import com.giapha.model.dto.generation.CreateGenerationRequest;
import com.giapha.model.dto.generation.GenerationDto;
import com.giapha.security.CustomUserDetails;
import com.giapha.service.GenerationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Generation endpoints nested under /api/families/{familyId}/generations.
 * The standalone DELETE /api/generations/{id} matches the spec.
 */
@RestController
@RequiredArgsConstructor
public class GenerationController {

    private final GenerationService generationService;

    // ----- /api/families/{familyId}/generations ----- //

    @GetMapping("/families/{familyId}/generations")
    public ResponseEntity<Map<String, Object>> list(
            @PathVariable UUID familyId,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        List<GenerationDto> data = generationService.list(familyId, currentUser.getUser());
        return ResponseEntity.ok(Map.of("generations", data));
    }

    @PostMapping("/families/{familyId}/generations")
    public ResponseEntity<Map<String, Object>> create(
            @PathVariable UUID familyId,
            @Valid @RequestBody CreateGenerationRequest req,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        GenerationDto gen = generationService.create(familyId, req, currentUser.getUser());
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("generation", gen));
    }

    // ----- /api/generations/{id} ----- //

    @DeleteMapping("/generations/{generationId}")
    public ResponseEntity<MessageResponse> delete(
            @PathVariable UUID generationId,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        return ResponseEntity.ok(generationService.delete(generationId, currentUser.getUser()));
    }
}
