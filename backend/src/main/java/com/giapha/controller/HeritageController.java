package com.giapha.controller;

import com.giapha.model.dto.heritage.CreateHeritageRequest;
import com.giapha.model.dto.heritage.HeritageDto;
import com.giapha.security.CustomUserDetails;
import com.giapha.service.HeritageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class HeritageController {

    private final HeritageService heritageService;

    @GetMapping("/families/{familyId}/heritages")
    public ResponseEntity<Map<String, Object>> list(
            @PathVariable UUID familyId,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        List<HeritageDto> data = heritageService.list(familyId, currentUser.getUser());
        return ResponseEntity.ok(Map.of("heritages", data));
    }

    @PostMapping("/families/{familyId}/heritages")
    public ResponseEntity<Map<String, Object>> create(
            @PathVariable UUID familyId,
            @Valid @RequestBody CreateHeritageRequest req,
            @AuthenticationPrincipal CustomUserDetails currentUser) {
        HeritageDto h = heritageService.create(familyId, req, currentUser.getUser());
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("heritage", h));
    }
}
