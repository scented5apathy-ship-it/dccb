package com.giapha.service;

import com.giapha.exception.BadRequestException;
import com.giapha.exception.ForbiddenException;
import com.giapha.exception.ResourceNotFoundException;
import com.giapha.model.dto.chat.CreateChatRequest;
import com.giapha.model.dto.chat.SendMessageRequest;
import com.giapha.model.entity.*;
import com.giapha.repository.*;
import com.giapha.security.CurrentUser;
import com.giapha.util.AuthorizationHelper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final FamilyChatRepository chatRepository;
    private final ChatMemberRepository chatMemberRepository;
    private final ChatMessageRepository messageRepository;
    private final UserRepository userRepository;
    private final AuthorizationHelper authz;
    private final CurrentUser currentUser;

    public Map<String, Object> listChats(UUID familyId) {
        UUID userId = currentUser.getCurrentUserId();
        authz.requireFamilyMember(userId, familyId);

        List<FamilyChat> chats = chatRepository.listByFamily(familyId);
        List<Map<String, Object>> items = new ArrayList<>();
        for (FamilyChat c : chats) {
            if (!chatMemberRepository.isMember(c.getId(), userId)) continue; // hide chats user hasn't joined
            int memberCount = chatRepository.countMembers(c.getId());
            int unreadCount = chatMemberRepository.unreadCount(c.getId(), userId);
            Map<String, Object> last = chatRepository.lastMessage(c.getId());
            items.add(Map.of(
                "chat", c,
                "memberCount", memberCount,
                "lastMessage", last,
                "unreadCount", unreadCount
            ));
        }
        return Map.of("chats", items);
    }

    @Transactional
    public Map<String, Object> createChat(UUID familyId, CreateChatRequest req) {
        UUID userId = currentUser.getCurrentUserId();
        authz.requireFamilyMember(userId, familyId);

        FamilyChat chat = FamilyChat.builder()
            .familyId(familyId)
            .name(req.getName())
            .description(req.getDescription())
            .createdBy(userId)
            .build();
        UUID id = chatRepository.insert(chat);

        // Add creator as ADMIN
        chatMemberRepository.add(id, userId, "ADMIN");
        if (req.getMemberIds() != null) {
            for (UUID memberId : req.getMemberIds()) {
                // Member IDs from the request are user IDs in this context.
                chatMemberRepository.add(id, memberId, "MEMBER");
            }
        }

        FamilyChat saved = chatRepository.findById(id).orElseThrow();
        return Map.of("chat", saved);
    }

    public Map<String, Object> listMessages(UUID chatId, UUID beforeMessageId, Integer limit) {
        FamilyChat chat = chatRepository.findById(chatId)
            .orElseThrow(() -> new ResourceNotFoundException("Chat", chatId.toString()));
        UUID userId = currentUser.getCurrentUserId();
        if (!chatMemberRepository.isMember(chatId, userId)) {
            throw new ForbiddenException("Bạn không phải thành viên của chat này");
        }

        int lim = limit == null ? 50 : Math.min(Math.max(limit, 1), 200);
        List<ChatMessage> messages = messageRepository.list(chatId, beforeMessageId, lim);

        // Collect sender IDs and reply IDs for batch hydration
        Set<UUID> senderIds = new HashSet<>();
        Set<UUID> replyIds = new HashSet<>();
        for (ChatMessage m : messages) {
            if (m.getSenderId() != null) senderIds.add(m.getSenderId());
            if (m.getReplyToMessageId() != null) replyIds.add(m.getReplyToMessageId());
        }
        Map<UUID, User> senders = new HashMap<>();
        for (UUID id : senderIds) userRepository.findById(id).ifPresent(u -> senders.put(id, u));
        Map<UUID, ChatMessage> replies = new HashMap<>();
        for (UUID id : replyIds) {
            ChatMessage r = messageRepository.findById(id);
            if (r != null) replies.put(id, r);
        }

        List<Map<String, Object>> items = new ArrayList<>();
        for (ChatMessage m : messages) {
            User sender = m.getSenderId() == null ? null : senders.get(m.getSenderId());
            ChatMessage reply = m.getReplyToMessageId() == null ? null : replies.get(m.getReplyToMessageId());
            items.add(Map.of(
                "message", m,
                "sender", sender == null ? null : Map.of(
                    "id", sender.getId(), "fullName", sender.getFullName(), "avatarUrl", sender.getAvatarUrl()
                ),
                "replyTo", reply
            ));
        }
        return Map.of("messages", items);
    }

    @Transactional
    public Map<String, Object> sendMessage(UUID chatId, SendMessageRequest req) {
        FamilyChat chat = chatRepository.findById(chatId)
            .orElseThrow(() -> new ResourceNotFoundException("Chat", chatId.toString()));
        UUID userId = currentUser.getCurrentUserId();
        if (!chatMemberRepository.isMember(chatId, userId)) {
            throw new ForbiddenException("Bạn không phải thành viên của chat này");
        }

        if (!"TEXT".equals(req.getMessageType())
            && !"IMAGE".equals(req.getMessageType())
            && !"FILE".equals(req.getMessageType())) {
            throw new BadRequestException("messageType không hợp lệ");
        }

        ChatMessage m = ChatMessage.builder()
            .chatId(chatId)
            .senderId(userId)
            .content(req.getContent())
            .messageType(req.getMessageType())
            .attachmentUrl(req.getAttachmentUrl())
            .replyToMessageId(req.getReplyToMessageId())
            .build();
        UUID id = messageRepository.insert(m);

        chatMemberRepository.updateLastRead(chatId, userId);

        ChatMessage saved = messageRepository.findById(id);
        User sender = userRepository.findById(userId).orElse(null);
        ChatMessage reply = req.getReplyToMessageId() == null
            ? null : messageRepository.findById(req.getReplyToMessageId());

        Map<String, Object> out = new LinkedHashMap<>();
        out.put("message", saved);
        out.put("sender", sender == null ? null : Map.of(
            "id", sender.getId(), "fullName", sender.getFullName(), "avatarUrl", sender.getAvatarUrl()
        ));
        out.put("replyTo", reply);
        return out;
    }
}