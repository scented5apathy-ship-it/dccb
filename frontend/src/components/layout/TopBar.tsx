'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  Bell,
  Search,
  Menu,
  LogOut,
  Settings,
  User as UserIcon,
  CheckCheck,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { getUser } from '@/lib/auth';
import { useAuth } from '@/hooks/useAuth';
import {
  useMarkAllRead,
  useNotifications,
} from '@/hooks/useNotifications';
import { showToast } from '@/components/ui/Toast';
import { formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

export interface TopBarProps {
  onMenuClick?: () => void;
  title?: string;
}

export function TopBar({ onMenuClick, title }: TopBarProps) {
  const cachedUser = typeof window !== 'undefined' ? getUser() : null;
  const { user, logout } = useAuth();
  const profile = user ?? cachedUser;
  const queryClient = useQueryClient();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const notificationsQuery = useNotifications();
  const markAll = useMarkAllRead();

  const unreadCount = notificationsQuery.data?.unreadCount ?? 0;
  const items = notificationsQuery.data?.notifications ?? [];

  const handleLogout = async () => {
    try {
      await logout();
      queryClient.clear();
      window.location.href = '/login';
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Lỗi';
      showToast.error('Đăng xuất thất bại', { description: message });
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-neutral-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
            className="lg:hidden"
            aria-label="Mở menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        {title && (
          <h1 className="text-base font-semibold text-neutral-900 sm:text-lg">
            {title}
          </h1>
        )}
      </div>

      <div className="hidden flex-1 max-w-md md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="search"
            placeholder="Tìm kiếm gia đình, công thức, câu chuyện..."
            className="block w-full rounded-lg border border-neutral-200 bg-neutral-50 py-2 pl-10 pr-3 text-sm focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            aria-label="Thông báo"
            className="relative"
            onClick={() => setNotifOpen((v) => !v)}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Button>
          {notifOpen && (
            <Card
              padding="none"
              className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden shadow-large"
            >
              <div className="flex items-center justify-between border-b border-neutral-100 px-3 py-2">
                <p className="text-sm font-semibold text-neutral-900">
                  Thông báo
                </p>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-xs text-primary-600 hover:underline disabled:opacity-50"
                  disabled={unreadCount === 0 || markAll.isPending}
                  onClick={async () => {
                    try {
                      const result = await markAll.mutateAsync();
                      showToast.success(
                        `Đã đánh dấu ${result.count} thông báo là đã đọc`
                      );
                    } catch (err) {
                      const message =
                        err instanceof Error
                          ? err.message
                          : 'Không thể đánh dấu';
                      showToast.error('Lỗi', { description: message });
                    }
                  }}
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Đọc tất cả
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notificationsQuery.isLoading ? (
                  <div className="flex justify-center py-6">
                    <Spinner size="sm" />
                  </div>
                ) : items.length === 0 ? (
                  <p className="p-4 text-center text-sm text-neutral-500">
                    Chưa có thông báo nào.
                  </p>
                ) : (
                  <ul className="divide-y divide-neutral-100">
                    {items.slice(0, 6).map((n) => (
                      <li
                        key={n.id}
                        className={cn(
                          'cursor-pointer px-3 py-2 hover:bg-neutral-50',
                          !n.isRead && 'bg-primary-50/40'
                        )}
                        onClick={() => setNotifOpen(false)}
                      >
                        <p className="text-sm font-medium text-neutral-900">
                          {n.title}
                        </p>
                        {n.content && (
                          <p className="line-clamp-2 text-xs text-neutral-600">
                            {n.content}
                          </p>
                        )}
                        <p className="mt-1 text-[10px] text-neutral-400">
                          {formatRelativeTime(n.createdAt)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <Link
                href="/notifications"
                onClick={() => setNotifOpen(false)}
                className="block border-t border-neutral-100 bg-neutral-50 px-3 py-2 text-center text-xs font-medium text-primary-700 hover:bg-primary-50"
              >
                Xem tất cả
              </Link>
            </Card>
          )}
        </div>

        {/* User menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setUserMenuOpen((v) => !v)}
            className="rounded-full ring-1 ring-transparent transition-shadow hover:ring-primary-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            aria-label="Mở menu người dùng"
          >
            <Avatar
              name={profile?.fullName ?? 'Khách'}
              src={profile?.avatarUrl}
              size="sm"
            />
          </button>
          {userMenuOpen && (
            <Card
              padding="none"
              className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden shadow-large"
            >
              <div className="border-b border-neutral-100 px-3 py-3">
                <p className="text-sm font-semibold text-neutral-900">
                  {profile?.fullName ?? 'Khách'}
                </p>
                <p className="line-clamp-1 text-xs text-neutral-500">
                  {profile?.email ?? ''}
                </p>
                {unreadCount > 0 && (
                  <Badge variant="primary" size="sm" className="mt-2">
                    {unreadCount} thông báo mới
                  </Badge>
                )}
              </div>
              <div className="py-1">
                <Link
                  href="/profile"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                >
                  <UserIcon className="h-4 w-4" />
                  Hồ sơ
                </Link>
                <Link
                  href="/notifications"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                >
                  <Bell className="h-4 w-4" />
                  Thông báo
                </Link>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-neutral-700 hover:bg-neutral-50"
                >
                  <Settings className="h-4 w-4" />
                  Cài đặt
                </button>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full items-center gap-2 border-t border-neutral-100 px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </button>
            </Card>
          )}
        </div>
      </div>
    </header>
  );
}

export default TopBar;