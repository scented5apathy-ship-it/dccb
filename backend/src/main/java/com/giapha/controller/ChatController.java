package com.giapha.controller;

import com.giapha.model.dto.chat.CreateChatRequest;
import com.giapha.model.dto.chat.SendMessageRequest;
import com.giapha.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @GetMapping("/families/{familyId}/chats")
    public Map<String, Object> listChats(@PathVariable UUID familyId) {
        return chatService.listChats(familyId);
    }

    @PostMapping("/families/{familyId}/chats")
    public Map<String, Object> createChat(@PathVariable UUID familyId,
                                          @RequestBody CreateChatRequest req) {
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
                                           @RequestBody SendMessageRequest req) {
        return chatService.sendMessage(chatId, req);
    }
}