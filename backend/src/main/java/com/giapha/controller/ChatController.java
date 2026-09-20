package com.giapha.controller;

import com.giapha.model.dto.chat.CreateChatRequest;
import com.giapha.model.dto.chat.SendMessageRequest;
import com.giapha.security.CustomUserDetails;
import com.giapha.service.ChatService;
import com.giapha.util.AuthorizationHelper;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final AuthorizationHelper authHelper;

    @GetMapping("/families/{familyId}/chats")
    public Map<String, Object> listChats(@PathVariable UUID familyId,
                                         @AuthenticationPrincipal CustomUserDetails currentUser) {
        authHelper.requireFamilyMember(currentUser.getId(), familyId);
        return chatService.listChats(familyId);
    }

    @PostMapping("/families/{familyId}/chats")
    public Map<String, Object> createChat(@PathVariable UUID familyId,
                                          @Valid @RequestBody CreateChatRequest req,
                                          @AuthenticationPrincipal CustomUserDetails currentUser) {
        authHelper.requireFamilyMember(currentUser.getId(), familyId);
        return chatService.createChat(familyId, req);
    }

    @GetMapping("/chats/{chatId}/messages")
    public Map<String, Object> listMessages(
            @PathVariable UUID chatId,
            @RequestParam(required = false) UUID before,
            @RequestParam(required = false) Integer limit
    ) {
        return chatService.listMessages(chatId, before, limit);
    }

    @PostMapping("/chats/{chatId}/messages")
    public Map<String, Object> sendMessage(@PathVariable UUID chatId,
                                           @Valid @RequestBody SendMessageRequest req) {
        return chatService.sendMessage(chatId, req);
    }
}