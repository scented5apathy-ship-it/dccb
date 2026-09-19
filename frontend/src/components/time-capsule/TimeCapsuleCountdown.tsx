'use client';

import { Sparkles, Clock, CalendarDays } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useCountdown } from '@/hooks/useTimeCapsules';
import { cn } from '@/lib/utils';

export interface TimeCapsuleCountdownProps {
  unlockAt: string;
  title?: string;
  variant?: 'card' | 'inline';
  className?: string;
}

/**
 * Visual countdown with day/hour/minute/second breakdown. Shows a special
 * "ready" state when the countdown hits zero.
 */
export function TimeCapsuleCountdown({
  unlockAt,
  title,
  variant = 'card',
  className,
}: TimeCapsuleCountdownProps) {
  const countdown = useCountdown(unlockAt);
  const almostReady =
    countdown.totalMs > 0 && countdown.totalMs < 1000 * 60 * 60 * 24;
  const ready = countdown.isUnlocked;

  const blocks: Array<{
    label: string;
    value: number;
    accent: string;
  }> = [
    {
      label: 'Ngày',
      value: countdown.days,
      accent: 'from-amber-100 to-amber-50',
    },
    {
      label: 'Giờ',
      value: countdown.hours,
      accent: 'from-orange-100 to-amber-50',
    },
    {
      label: 'Phút',
      value: countdown.minutes,
      accent: 'from-yellow-100 to-amber-50',
    },
    {
      label: 'Giây',
      value: countdown.seconds,
      accent: 'from-rose-100 to-amber-50',
    },
  ];

  if (ready) {
    if (variant === 'inline') {
      return (
        <p
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 px-3 py-1 text-sm font-medium text-green-700 shadow-soft',
            className
          )}
        >
          <Sparkles className="h-4 w-4 animate-pulse" />
          Đã đến lúc mở!
        </p>
      );
    }
    return (
      <Card
        padding="md"
        className={cn(
          'border-green-300 bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 shadow-soft',
          className
        )}
      >
        <div className="flex items-center gap-3">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-medium">
            <Sparkles className="h-6 w-6 animate-pulse" />
            <span className="absolute -right-0.5 -top-0.5 h-3 w-3 animate-ping rounded-full bg-green-400 opacity-75" />
          </div>
          <div>
            <p className="font-serif text-base font-semibold text-green-800">
              {title ? `${title}: ` : ''}Đã đến lúc mở hộp thời gian!
            </p>
            <p className="text-xs text-green-700">
              Nhấn &ldquo;Mở khóa&rdquo; để khám phá nội dung bên trong.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (variant === 'inline') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 rounded-full bg-amber-100/80 px-2.5 py-1 text-xs font-medium text-amber-800',
          className
        )}
      >
        <Clock className="h-3.5 w-3.5" />
        {countdown.days} ngày · {String(countdown.hours).padStart(2, '0')}:
        {String(countdown.minutes).padStart(2, '0')}:
        {String(countdown.seconds).padStart(2, '0')}
      </span>
    );
  }

  return (
    <Card
      padding="md"
      className={cn(
        'border-amber-200/60 bg-gradient-to-br from-amber-50/40 via-white to-orange-50/30',
        className
      )}
    >
      {title && (
        <div className="mb-3 flex items-center gap-1.5 text-sm font-medium text-neutral-700">
          <CalendarDays className="h-4 w-4 text-primary-600" />
          {title}
        </div>
      )}
      <div className="grid grid-cols-4 gap-2 text-center">
        {blocks.map((b, i) => (
          <div
            key={b.label}
            className={cn(
              'relative overflow-hidden rounded-xl border bg-gradient-to-b p-2 py-3 shadow-soft transition-colors',
              almostReady
                ? 'border-amber-300 from-amber-100 to-amber-50'
                : ready
                  ? 'border-green-300 from-green-100 to-green-50'
                  : 'border-neutral-200/80 ' + b.accent
            )}
          >
            {/* Highlight */}
            <span
              className="pointer-events-none absolute inset-x-2 top-0 h-1/2 rounded-full bg-white/40 opacity-60 blur-sm"
              aria-hidden="true"
            />
            <p
              className={cn(
                'relative font-serif text-2xl font-bold tabular-nums',
                almostReady
                  ? 'text-amber-700'
                  : ready
                    ? 'text-green-700'
                    : 'text-primary-700',
                i === 3 && !ready && 'animate-pulse'
              )}
            >
              {String(b.value).padStart(2, '0')}
            </p>
            <p className="relative mt-1 text-[10px] font-medium uppercase tracking-wider text-neutral-500">
              {b.label}
            </p>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default TimeCapsuleCountdown;