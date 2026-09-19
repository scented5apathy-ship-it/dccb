'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { chatApi } from '@/lib/api-client';
import type {
  ChatListResponse,
  ChatMessageListResponse,
  CreateChatRequest,
  SendMessageRequest,
  SendMessageResponse,
} from '@/types/chat';

const CHAT_KEY = ['chats'] as const;

export function useChats(
  familyId: string | undefined
): UseQueryResult<ChatListResponse, Error> {
  return useQuery({
    queryKey: [...CHAT_KEY, 'list', familyId],
    queryFn: () => chatApi.list(familyId ?? ''),
    enabled: Boolean(familyId),
    // Refresh periodically so new messages surface without manual reload.
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
}

type CreateChatInput = {
  familyId: string;
  name: string;
  description?: string;
  memberIds?: string[];
};

export function useCreateChat(): UseMutationResult<
  { chat: unknown },
  Error,
  CreateChatInput
> {
  const queryClient = useQueryClient();
  return useMutation({
    // Send only the body fields the backend expects (name, description, memberIds).
    // familyId is already in the URL path, so it must NOT appear in the payload.
    mutationFn: ({ familyId, ...body }) =>
      chatApi.create(familyId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CHAT_KEY });
    },
  });
}

export function useChatMessages(
  chatId: string | undefined
): UseQueryResult<ChatMessageListResponse, Error> {
  return useQuery({
    queryKey: [...CHAT_KEY, chatId, 'messages'],
    queryFn: () => chatApi.listMessages(chatId ?? ''),
    enabled: Boolean(chatId),
    refetchInterval: 15_000,
  });
}

export function useSendMessage(): UseMutationResult<
  SendMessageResponse,
  Error,
  { chatId: string; payload: SendMessageRequest }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ chatId, payload }) => chatApi.sendMessage(chatId, payload),
    onSuccess: (_data, { chatId }) => {
      queryClient.invalidateQueries({
        queryKey: [...CHAT_KEY, chatId, 'messages'],
      });
      queryClient.invalidateQueries({ queryKey: CHAT_KEY });
    },
  });
}