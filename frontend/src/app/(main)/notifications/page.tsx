'use client';

import { useState } from 'react';
import { Bell, CheckCheck, Filter } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { Spinner } from '@/components/ui/Spinner';
import { NotificationItem } from '@/components/notification/NotificationItem';
import {
  useNotifications,
  useMarkAllRead,
} from '@/hooks/useNotifications';
import { showToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

export default function NotificationsPage() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const notificationsQuery = useNotifications({ unreadOnly });
  const markAll = useMarkAllRead();

  const items = notificationsQuery.data?.notifications ?? [];
  const unreadCount = notificationsQuery.data?.unreadCount ?? 0;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-serif text-2xl font-semibold text-neutral-900">
            <Bell className="h-6 w-6 text-primary-600" />
            Thông báo
            {unreadCount > 0 && (
              <Badge variant="primary" size="md">
                {unreadCount} mới
              </Badge>
            )}
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Cập nhật mới nhất về các hoạt động gia đình của bạn.
          </p>
        </div>
        <Button
          variant="outline"
          leftIcon={<CheckCheck className="h-4 w-4" />}
          onClick={async () => {
            try {
              const result = await markAll.mutateAsync();
              showToast.success(
                `Đã đánh dấu ${result.count} thông báo là đã đọc`
              );
            } catch (err) {
              const message =
                err instanceof Error ? err.message : 'Không thể đánh dấu';
              showToast.error('Lỗi', { description: message });
            }
          }}
          loading={markAll.isPending}
          disabled={unreadCount === 0}
        >
          Đánh dấu tất cả đã đọc
        </Button>
      </header>

      <Card padding="sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
            <Filter className="h-3.5 w-3.5" /> Lọc:
          </span>
          {[
            { value: false, label: 'Tất cả' },
            { value: true, label: 'Chưa đọc' },
          ].map((opt) => (
            <button
              key={opt.label}
              type="button"
              onClick={() => setUnreadOnly(opt.value)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                unreadOnly === opt.value
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Card>

      {notificationsQuery.isLoading && (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner size="lg" label="Đang tải thông báo..." />
        </div>
      )}

      {notificationsQuery.error && (
        <Card padding="md" className="border-red-200 bg-red-50 text-red-700">
          Không thể tải thông báo: {(notificationsQuery.error as Error)?.message}
        </Card>
      )}

      {!notificationsQuery.isLoading && items.length === 0 && (
        <EmptyState
          icon={<Bell className="h-8 w-8" />}
          title={
            unreadOnly ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'
          }
          description="Các thông báo mới sẽ xuất hiện ở đây."
        />
      )}

      <div className="space-y-2">
        {items.map((n) => (
          <NotificationItem key={n.id} notification={n} />
        ))}
      </div>
    </div>
  );
}