'use client';

import { useEffect, useRef } from 'react';
import { MessageItem } from './MessageItem';
import { cn } from '@/lib/utils';
import type { MessageEntry } from '@/types/chat';

export interface MessageListProps {
  messages: MessageEntry[];
  currentUserId?: string;
  className?: string;
}

export function MessageList({
  messages,
  currentUserId,
  className,
}: MessageListProps) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-1 items-center justify-center text-sm text-neutral-400',
          className
        )}
      >
        Chưa có tin nhắn nào. Hãy bắt đầu cuộc trò chuyện!
      </div>
    );
  }

  // Group consecutive messages from the same sender to suppress avatars.
  return (
    <div className={cn('flex-1 space-y-2 overflow-y-auto px-3 py-4', className)}>
      {messages.map((m, idx) => {
        const prev = messages[idx - 1];
        const showAvatar = !prev || prev.message.senderId !== m.message.senderId;
        const isMine = Boolean(
          currentUserId && m.message.senderId === currentUserId
        );
        return (
          <MessageItem
            key={m.message.id}
            entry={m}
            isMine={isMine}
            showAvatar={showAvatar}
          />
        );
      })}
      <div ref={endRef} />
    </div>
  );
}

export default MessageList;