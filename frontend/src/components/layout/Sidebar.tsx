'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Users,
  UtensilsCrossed,
  BookOpen,
  Clock,
  Calendar,
  User as UserIcon,
  Trees,
  MessageCircle,
  Bell,
  Image as ImageIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Route } from './types';

const ROUTES: Route[] = [
  { href: '/dashboard', label: 'Trang chủ', icon: Home },
  { href: '/families', label: 'Gia đình', icon: Users },
  { href: '/recipes', label: 'Công thức', icon: UtensilsCrossed },
  { href: '/stories', label: 'Câu chuyện', icon: BookOpen },
  { href: '/time-capsules', label: 'Hộp thời gian', icon: Clock },
  { href: '/events', label: 'Sự kiện', icon: Calendar },
  { href: '/chat', label: 'Trò chuyện', icon: MessageCircle },
  { href: '/notifications', label: 'Thông báo', icon: Bell },
  { href: '/profile', label: 'Hồ sơ', icon: UserIcon },
];

export interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'flex h-full w-64 shrink-0 flex-col border-r border-neutral-200 bg-white',
        className
      )}
    >
      <div className="flex items-center gap-2 px-6 py-5 border-b border-neutral-100">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white">
          <Trees className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-neutral-900">Cây Gia Phả Số</p>
          <p className="text-xs text-neutral-500">AncestryTree</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {ROUTES.map((route) => {
          const Icon = route.icon;
          const isActive =
            pathname === route.href || pathname.startsWith(`${route.href}/`);
          return (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{route.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-neutral-100 px-4 py-3 text-xs text-neutral-400">
        v0.2.0 · © 2026
      </div>
    </aside>
  );
}

export default Sidebar;