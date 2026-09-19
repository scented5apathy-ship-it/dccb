'use client';

import { MessageCircle } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/shared/EmptyState';
import { cn, formatRelativeTime, truncate } from '@/lib/utils';
import type { ChatEntry } from '@/types/chat';

export interface ChatListProps {
  chats: ChatEntry[];
  selectedChatId?: string;
  onSelect: (chatId: string) => void;
}

export function ChatList({ chats, selectedChatId, onSelect }: ChatListProps) {
  if (chats.length === 0) {
    return (
      <Card padding="md">
        <EmptyState
          icon={<MessageCircle className="h-8 w-8" />}
          title="Chưa có cuộc trò chuyện"
          description="Tạo một cuộc trò chuyện mới để bắt đầu."
        />
      </Card>
    );
  }

  return (
    <ul className="space-y-1">
      {chats.map(({ chat, lastMessage, unreadCount }) => {
        const active = chat.id === selectedChatId;
        return (
          <li key={chat.id}>
            <button
              type="button"
              onClick={() => onSelect(chat.id)}
              className={cn(
                'flex w-full items-start gap-3 rounded-xl p-3 text-left transition-colors',
                active
                  ? 'bg-primary-50'
                  : 'hover:bg-neutral-50'
              )}
            >
              <Avatar size="md" name={chat.name} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-neutral-900">
                    {chat.name}
                  </p>
                  {(unreadCount ?? 0) > 0 && (
                    <Badge variant="primary" size="sm">
                      {unreadCount}
                    </Badge>
                  )}
                </div>
                <p className="mt-0.5 line-clamp-1 text-xs text-neutral-500">
                  {lastMessage?.content
                    ? truncate(lastMessage.content, 80)
                    : 'Chưa có tin nhắn'}
                </p>
                <p className="mt-0.5 text-[10px] uppercase tracking-wide text-neutral-400">
                  {formatRelativeTime(lastMessage?.createdAt ?? chat.createdAt)}
                </p>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export default ChatList;