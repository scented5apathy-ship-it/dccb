'use client';

import { FileText, Image as ImageIcon, Reply } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { formatDateTime, cn } from '@/lib/utils';
import type { MessageEntry } from '@/types/chat';

export interface MessageItemProps {
  entry: MessageEntry;
  isMine: boolean;
  showAvatar?: boolean;
}

export function MessageItem({
  entry,
  isMine,
  showAvatar = true,
}: MessageItemProps) {
  const { message, sender, replyTo } = entry;

  const renderContent = () => {
    if (message.messageType === 'IMAGE' && message.attachmentUrl) {
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={message.attachmentUrl}
          alt=""
          className="max-h-72 max-w-xs rounded-lg object-cover"
        />
      );
    }
    if (message.messageType === 'FILE' && message.attachmentUrl) {
      return (
        <a
          href={message.attachmentUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 text-sm underline"
        >
          <FileText className="h-4 w-4" />
          Tệp đính kèm
        </a>
      );
    }
    return (
      <p className="whitespace-pre-wrap break-words text-sm">
        {message.content}
      </p>
    );
  };

  return (
    <div
      className={cn(
        'flex items-end gap-2',
        isMine ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {showAvatar ? (
        <Avatar
          size="sm"
          src={sender?.avatarUrl}
          name={sender?.fullName ?? '?'}
        />
      ) : (
        <span className="w-8 shrink-0" />
      )}
      <div
        className={cn(
          'flex max-w-[75%] flex-col gap-1',
          isMine ? 'items-end' : 'items-start'
        )}
      >
        {showAvatar && (
          <p className="px-1 text-xs text-neutral-500">
            {sender?.fullName ?? '—'}
          </p>
        )}
        <div
          className={cn(
            'rounded-2xl px-3 py-2',
            isMine
              ? 'bg-primary-600 text-white'
              : 'bg-white text-neutral-800 shadow-soft'
          )}
        >
          {replyTo && (
            <div
              className={cn(
                'mb-1 flex items-center gap-1 rounded-md border-l-2 px-2 py-1 text-xs',
                isMine
                  ? 'border-white/50 bg-white/10 text-white/80'
                  : 'border-primary-300 bg-primary-50 text-primary-700'
              )}
            >
              <Reply className="h-3 w-3" />
              <span className="line-clamp-1">
                {replyTo.content ?? '(tin nhắn đã xoá)'}
              </span>
            </div>
          )}
          {renderContent()}
        </div>
        <p className="px-1 text-[10px] text-neutral-400">
          {formatDateTime(message.createdAt)}
          {message.editedAt && ' · đã chỉnh sửa'}
        </p>
      </div>
    </div>
  );
}

export default MessageItem;