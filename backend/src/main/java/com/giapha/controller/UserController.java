package com.giapha.controller;

import com.giapha.model.dto.auth.UserDto;
import com.giapha.model.dto.user.UpdateProfileRequest;
import com.giapha.model.dto.user.UserSearchResult;
import com.giapha.security.CurrentUser;
import com.giapha.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final CurrentUser currentUser;

    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getById(@PathVariable UUID id) {
        UserDto user = userService.getById(id);
        return ResponseEntity.ok(user);
    }

    @PutMapping("/me")
    public ResponseEntity<UserDto> updateMyProfile(@Valid @RequestBody UpdateProfileRequest request) {
        UUID userId = currentUser.getCurrentUserId();
        UserDto updated = userService.updateMyProfile(userId, request);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/search")
    public ResponseEntity<List<UserSearchResult>> search(@RequestParam("q") String query) {
        List<UserSearchResult> results = userService.search(query);
        return ResponseEntity.ok(results);
    }
}