'use client';

import { Clock, Gift, User as UserIcon, CalendarDays, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { TimeCapsuleSeal } from './TimeCapsuleSeal';
import { TimeCapsuleCountdown } from './TimeCapsuleCountdown';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { TimeCapsuleEntry } from '@/types/time-capsule';

export interface TimeCapsuleCardProps {
  entry: TimeCapsuleEntry;
  /** Optional family context — currently unused, kept for future routing. */
  familyId?: string;
  /** Optional click handler. When provided the card becomes a click target. */
  onClick?: () => void;
}

function deriveStatus(
  entry: TimeCapsuleEntry
): 'sealed' | 'available' | 'opened' {
  if (entry.capsule.isOpened) return 'opened';
  if (entry.isUnlockable) return 'available';
  return 'sealed';
}

function statusBadge(status: 'sealed' | 'available' | 'opened') {
  if (status === 'opened') {
    return { label: 'Đã mở', variant: 'success' as const };
  }
  if (status === 'available') {
    return { label: 'Sẵn sàng mở', variant: 'info' as const };
  }
  return { label: 'Đang niêm phong', variant: 'warning' as const };
}

const statusEnvelopePalette: Record<
  'sealed' | 'available' | 'opened',
  string
> = {
  sealed:
    'border-amber-200/80 bg-gradient-to-br from-amber-100/80 via-amber-50/40 to-orange-50/60',
  available:
    'border-emerald-300 bg-gradient-to-br from-emerald-100/70 via-amber-50/40 to-yellow-50/50',
  opened:
    'border-stone-200 bg-gradient-to-br from-stone-100/80 via-amber-50/30 to-stone-50/60',
};

/**
 * Renders a single time capsule as a sealed envelope card.
 *
 * IMPORTANT: This component does NOT wrap itself in any anchor / link.
 * The owning page decides what should happen on click (open a modal,
 * navigate to a detail route, etc.). Previously this card wrapped
 * itself in `<Link>`, which intercepted the parent's `onClick` and
 * silently refreshed the same list page — making the UI feel broken.
 */
export function TimeCapsuleCard({ entry, onClick }: TimeCapsuleCardProps) {
  const status = deriveStatus(entry);
  const badge = statusBadge(status);
  const capsule = entry.capsule;

  // When onClick is provided we render as a button so the parent can
  // react to user interaction. Without onClick we render as a static
  // card (e.g. inside a custom click wrapper).
  const interactive = Boolean(onClick);

  const content = (
    <Card
      hoverable={interactive}
      padding="none"
      className={cn(
        'relative overflow-hidden border-2 shadow-soft transition-all',
        statusEnvelopePalette[status],
        interactive && 'hover:shadow-large hover:-translate-y-0.5'
      )}
    >
      {/* Decorative envelope flap corner */}
      {status === 'sealed' && (
        <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rotate-45 bg-gradient-to-br from-amber-300/40 to-amber-100/0" />
      )}

      <div className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={badge.variant} size="sm">
              {badge.label}
            </Badge>
            <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
              <CalendarDays className="h-3 w-3" />
              {capsule.unlockCondition === 'DATE'
                ? 'Mở theo ngày'
                : capsule.unlockCondition === 'EVENT'
                  ? 'Mở theo sự kiện'
                  : 'Mở thủ công'}
            </span>
          </div>
          <h3
            className={cn(
              'mt-2 line-clamp-2 font-serif text-base font-semibold text-neutral-900',
              interactive && 'group-hover:text-primary-700'
            )}
          >
            {capsule.title}
          </h3>
          {capsule.content && (
            <p className="mt-1.5 line-clamp-2 text-sm text-neutral-600">
              {capsule.content}
            </p>
          )}
        </div>
        <TimeCapsuleSeal status={status} size="md" />
      </div>

      <div className="relative border-t border-amber-200/50 bg-white/70 p-4 backdrop-blur-sm">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-600">
          <span className="inline-flex items-center gap-1.5">
            <UserIcon className="h-3.5 w-3.5" />
            Tạo bởi{' '}
            <span className="font-medium text-neutral-800">
              {entry.creator?.fullName ?? '—'}
            </span>
          </span>
          {entry.recipient?.fullName && (
            <span className="inline-flex items-center gap-1.5">
              <Gift className="h-3.5 w-3.5" />
              Gửi tới{' '}
              <span className="font-medium text-neutral-800">
                {entry.recipient.fullName}
              </span>
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {capsule.unlockDate
              ? `Mở ${formatDate(capsule.unlockDate)}`
              : 'Chưa đặt ngày'}
          </span>
        </div>

        {status !== 'opened' && capsule.unlockDate && (
          <div className="mt-3">
            <TimeCapsuleCountdown
              unlockAt={capsule.unlockDate}
              variant="inline"
            />
          </div>
        )}
        {status === 'opened' && capsule.openedAt && (
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
            <Sparkles className="h-3 w-3" />
            Đã mở {formatDate(capsule.openedAt)}
          </p>
        )}
      </div>

      {entry.recipient?.fullName && (
        <div className="absolute right-4 top-4">
          <Avatar
            size="xs"
            name={entry.recipient.fullName}
            className="ring-2 ring-white"
          />
        </div>
      )}
    </Card>
  );

  if (interactive && onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="group block w-full text-left"
        aria-label={`Mở hộp thời gian ${capsule.title}`}
      >
        {content}
      </button>
    );
  }
  return content;
}

export default TimeCapsuleCard;