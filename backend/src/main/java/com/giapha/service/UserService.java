package com.giapha.service;

import com.giapha.exception.ResourceNotFoundException;
import com.giapha.model.dto.auth.UserDto;
import com.giapha.model.dto.user.UpdateProfileRequest;
import com.giapha.model.dto.user.UserSearchResult;
import com.giapha.model.entity.User;
import com.giapha.repository.UserRepository;
import com.giapha.util.StringUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private static final int SEARCH_LIMIT = 20;

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public UserDto getById(UUID id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Người dùng", id.toString()));
        return UserDto.fromEntity(user);
    }

    @Transactional
    public UserDto updateMyProfile(UUID userId, UpdateProfileRequest request) {
        // Make sure the user actually exists before updating.
        userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Người dùng", userId.toString()));

        User updated = userRepository.updateProfile(
            userId,
            request.getFullName().trim(),
            StringUtil.defaultIfBlank(request.getPhone(), null),
            StringUtil.defaultIfBlank(request.getBio(), null),
            StringUtil.defaultIfBlank(request.getAvatarUrl(), null)
        );

        return UserDto.fromEntity(updated);
    }

    @Transactional(readOnly = true)
    public List<UserSearchResult> search(String query) {
        if (!StringUtil.hasText(query) || query.trim().length() < 2) {
            return List.of();
        }
        return userRepository.search(query.trim(), SEARCH_LIMIT).stream()
            .map(UserSearchResult::fromEntity)
            .collect(Collectors.toList());
    }
}