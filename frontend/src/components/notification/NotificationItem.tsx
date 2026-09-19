'use client';

import Link from 'next/link';
import {
  Bell,
  CalendarClock,
  CheckCircle2,
  Clock4,
  MessageCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn, formatRelativeTime } from '@/lib/utils';
import { useMarkRead } from '@/hooks/useNotifications';
import { showToast } from '@/components/ui/Toast';
import type { Notification } from '@/types/notification';

export interface NotificationItemProps {
  notification: Notification;
  /** Hide the "Mark as read" action when true. */
  hideAction?: boolean;
}

function iconFor(type?: string) {
  if (!type) return Bell;
  if (type.includes('TIME_CAPSULE')) return Clock4;
  if (type.includes('EVENT')) return CalendarClock;
  if (type.includes('CHAT') || type.includes('MESSAGE')) return MessageCircle;
  return Bell;
}

function linkFor(n: Notification): string | null {
  if (!n.relatedEntityType) return null;
  switch (n.relatedEntityType) {
    case 'TIME_CAPSULE':
      return '/time-capsules';
    case 'EVENT':
      return '/events';
    case 'CHAT':
      return '/chat';
    case 'FAMILY':
      return '/families';
    case 'STORY':
      return '/stories';
    default:
      return null;
  }
}

export function NotificationItem({
  notification,
  hideAction,
}: NotificationItemProps) {
  const markRead = useMarkRead();
  const Icon = iconFor(notification.notificationType);
  const href = linkFor(notification);
  const unread = !notification.isRead;

  const handleRead = async () => {
    try {
      await markRead.mutateAsync(notification.id);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Không thể đánh dấu đã đọc';
      showToast.error('Lỗi', { description: message });
    }
  };

  const body = (
    <Card
      padding="sm"
      className={cn(
        'flex items-start gap-3 transition-colors',
        unread && 'border-primary-200 bg-primary-50/40'
      )}
    >
      <div
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
          unread
            ? 'bg-primary-100 text-primary-700'
            : 'bg-neutral-100 text-neutral-500'
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-neutral-900">
            {notification.title}
          </p>
          {unread && (
            <Badge variant="primary" size="sm">
              Mới
            </Badge>
          )}
        </div>
        {notification.content && (
          <p className="mt-1 line-clamp-2 text-sm text-neutral-600">
            {notification.content}
          </p>
        )}
        <p className="mt-1 text-xs text-neutral-400">
          {formatRelativeTime(notification.createdAt)}
        </p>
      </div>
      {!hideAction && unread && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRead}
          loading={markRead.isPending}
          leftIcon={<CheckCircle2 className="h-4 w-4" />}
        >
          Đã đọc
        </Button>
      )}
    </Card>
  );

  if (href) {
    return (
      <Link href={href} onClick={() => unread && handleRead()}>
        {body}
      </Link>
    );
  }
  return body;
}

export default NotificationItem;