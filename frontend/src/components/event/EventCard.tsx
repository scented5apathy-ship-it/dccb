'use client';

import Link from 'next/link';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatDateTime } from '@/lib/utils';
import type { EventEntry, EventType } from '@/types/event';

export interface EventCardProps {
  entry: EventEntry;
  familyId?: string;
}

const typeLabel: Record<EventType, string> = {
  WEDDING: 'Đám cưới',
  FUNERAL: 'Tang lễ',
  BIRTHDAY: 'Sinh nhật',
  ANNIVERSARY: 'Kỷ niệm',
  REUNION: 'Đoàn tụ',
  HOLIDAY: 'Lễ hội',
  OTHER: 'Khác',
};

const typeVariant: Record<
  EventType,
  'primary' | 'success' | 'warning' | 'danger' | 'info' | 'default'
> = {
  WEDDING: 'danger',
  FUNERAL: 'default',
  BIRTHDAY: 'success',
  ANNIVERSARY: 'primary',
  REUNION: 'info',
  HOLIDAY: 'warning',
  OTHER: 'default',
};

export function EventCard({ entry }: EventCardProps) {
  const e = entry.event;
  // Detail page lives at `/events/{id}` (global route, exists in
  // frontend/src/app/(main)/events/[id]/page.tsx). The previous code
  // tried to build `/families/{familyId}/events/{eventId}` which 404'd
  // because that route doesn't exist.
  const href = `/events/${e.id}`;
  const start = new Date(e.eventDate);
  const isPast = start.getTime() < Date.now();

  return (
    <Link href={href} className="group block">
      <Card hoverable padding="none" className="overflow-hidden">
        <div className="relative aspect-[16/9] w-full bg-gradient-to-br from-primary-100 to-accent-100">
          {e.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={e.coverImageUrl}
              alt={e.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-primary-400">
              <Calendar className="h-12 w-12" />
            </div>
          )}
          <div className="absolute left-3 top-3 flex flex-wrap gap-1">
            <Badge variant={typeVariant[e.eventType] ?? 'default'} size="sm">
              {typeLabel[e.eventType] ?? e.eventType}
            </Badge>
            {isPast && (
              <Badge variant="default" size="sm">
                Đã qua
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-2 p-4">
          <h3 className="line-clamp-2 text-base font-semibold text-neutral-900 group-hover:text-primary-700">
            {e.title}
          </h3>
          {e.description && (
            <p className="line-clamp-2 text-sm text-neutral-600">
              {e.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {formatDateTime(e.eventDate)}
            </span>
            {e.location && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {e.location}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {entry.attendeeCount ?? 0} người
            </span>
            {(entry.goingCount ?? 0) > 0 && (
              <span className="inline-flex items-center gap-1.5 text-green-700">
                <Clock className="h-3.5 w-3.5" />
                {entry.goingCount} tham dự
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}

export default EventCard;