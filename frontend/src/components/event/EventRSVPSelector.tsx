'use client';

import { CheckCircle, HelpCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { showToast } from '@/components/ui/Toast';
import { useRsvp } from '@/hooks/useEvents';
import type { RsvpStatus } from '@/types/event';
import { cn } from '@/lib/utils';

export interface EventRSVPSelectorProps {
  eventId: string;
  memberId: string;
  currentStatus?: RsvpStatus;
  onChange?: (status: RsvpStatus) => void;
  className?: string;
}

const options: Array<{
  value: RsvpStatus;
  label: string;
  icon: typeof CheckCircle;
  palette: string;
}> = [
  {
    value: 'GOING',
    label: 'Sẽ tham dự',
    icon: CheckCircle,
    palette: 'border-green-300 bg-green-50 text-green-700',
  },
  {
    value: 'MAYBE',
    label: 'Có thể',
    icon: HelpCircle,
    palette: 'border-amber-300 bg-amber-50 text-amber-700',
  },
  {
    value: 'NOT_GOING',
    label: 'Không tham dự',
    icon: XCircle,
    palette: 'border-red-300 bg-red-50 text-red-700',
  },
];

export function EventRSVPSelector({
  eventId,
  memberId,
  currentStatus,
  className,
}: EventRSVPSelectorProps) {
  const rsvp = useRsvp();

  const choose = async (status: RsvpStatus) => {
    try {
      await rsvp.mutateAsync({
        eventId,
        payload: { memberId, rsvpStatus: status },
      });
      showToast.success(
        status === 'GOING'
          ? 'Đã ghi nhận tham dự'
          : status === 'MAYBE'
            ? 'Đã ghi nhận có thể tham dự'
            : 'Đã ghi nhận không tham dự'
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Không thể cập nhật RSVP';
      showToast.error('RSVP thất bại', { description: message });
    }
  };

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = currentStatus === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            disabled={rsvp.isPending}
            onClick={() => choose(opt.value)}
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-colors',
              active
                ? opt.palette
                : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
            )}
          >
            <Icon className="h-4 w-4" />
            {opt.label}
          </button>
        );
      })}
      {rsvp.isPending && <Button loading variant="ghost" className="ml-2" />}
    </div>
  );
}

export default EventRSVPSelector;