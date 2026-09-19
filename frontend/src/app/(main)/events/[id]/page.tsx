'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Trash2,
  Users as UsersIcon,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { EventGallery } from '@/components/event/EventGallery';
import { EventRSVPSelector } from '@/components/event/EventRSVPSelector';
import { showToast } from '@/components/ui/Toast';
import {
  useDeleteEvent,
  useEvent,
} from '@/hooks/useEvents';
import { useFamilyMembers } from '@/hooks/useFamily';
import { useAuth } from '@/hooks/useAuth';
import { formatDateTime, formatDate } from '@/lib/utils';
import type { EventType } from '@/types/event';

interface PageProps {
  params: { id: string };
}

const TYPE_LABEL: Record<EventType, string> = {
  WEDDING: 'Đám cưới',
  FUNERAL: 'Tang lễ',
  BIRTHDAY: 'Sinh nhật',
  ANNIVERSARY: 'Kỷ niệm',
  REUNION: 'Đoàn tụ',
  HOLIDAY: 'Lễ hội',
  OTHER: 'Khác',
};

const TYPE_VARIANT: Record<
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

export default function EventDetailPage({ params }: PageProps) {
  const eventId = params.id;
  const { user } = useAuth();
  const eventQuery = useEvent(eventId);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const event = eventQuery.data?.event;
  const familyId = event?.familyId;
  const deleteMutation = useDeleteEvent();
  const membersQuery = useFamilyMembers(familyId);

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(eventId);
      showToast.success('Đã xoá sự kiện');
      setConfirmDelete(false);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Không thể xoá sự kiện';
      showToast.error('Xoá thất bại', { description: message });
    }
  };

  if (eventQuery.isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner size="lg" label="Đang tải sự kiện..." />
      </div>
    );
  }

  if (eventQuery.error || !event) {
    return (
      <Card padding="lg" className="text-center">
        <p className="text-neutral-700">
          Không tìm thấy sự kiện hoặc bạn không có quyền truy cập.
        </p>
        <div className="mt-4">
          <Link href="/events">
            <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Quay lại
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  const isCreator = user?.id && event.creatorId === user.id;
  const start = new Date(event.eventDate);
  const isPast = start.getTime() < Date.now();

  return (
    <div className="space-y-6">
      <Link
        href="/events"
        className="inline-flex items-center gap-1 text-sm text-primary-700 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" />
        Danh sách sự kiện
      </Link>

      <Card padding="none" className="overflow-hidden">
        <div className="relative aspect-[21/9] w-full bg-gradient-to-br from-primary-100 to-accent-100">
          {event.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.coverImageUrl}
              alt={event.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-primary-300">
              <Calendar className="h-24 w-24" />
            </div>
          )}
        </div>

        <div className="space-y-4 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <Badge variant={TYPE_VARIANT[event.eventType]} size="md">
                {TYPE_LABEL[event.eventType] ?? event.eventType}
              </Badge>
              <h1 className="mt-2 font-serif text-3xl font-semibold text-neutral-900">
                {event.title}
              </h1>
              <p className="mt-1 text-sm text-neutral-500">
                Tạo bởi {eventQuery.data?.creator?.fullName ?? '—'}
              </p>
            </div>
            {isCreator && (
              <Button
                variant="outline"
                leftIcon={<Trash2 className="h-4 w-4" />}
                onClick={() => setConfirmDelete(true)}
              >
                Xoá
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-neutral-700">
            <span className="inline-flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary-600" />
              {formatDateTime(event.eventDate)}
              {event.endDate && ` - ${formatDateTime(event.endDate)}`}
            </span>
            {event.location && (
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary-600" />
                {event.location}
              </span>
            )}
            <span className="inline-flex items-center gap-2">
              <UsersIcon className="h-4 w-4 text-primary-600" />
              {eventQuery.data?.attendeeCount ?? 0} thành viên
              {(eventQuery.data?.goingCount ?? 0) > 0 && (
                <span className="text-green-700">
                  · {eventQuery.data?.goingCount} tham dự
                </span>
              )}
            </span>
            <Badge variant={isPast ? 'default' : 'info'}>
              {isPast ? 'Đã qua' : 'Sắp tới'}
            </Badge>
          </div>

          {event.description && (
            <p className="whitespace-pre-wrap text-neutral-700">
              {event.description}
            </p>
          )}
        </div>
      </Card>

      {user && familyId && (
        <Card padding="lg">
          <h2 className="mb-3 text-lg font-semibold text-neutral-900">
            Bạn sẽ tham dự?
          </h2>
          <EventRSVPSelector
            eventId={eventId}
            memberId={user.id}
          />
        </Card>
      )}

      <Card padding="lg">
        <h2 className="mb-3 text-lg font-semibold text-neutral-900">
          Thành viên ({membersQuery.data?.members?.length ?? 0})
        </h2>
        {membersQuery.isLoading ? (
          <Spinner size="md" label="Đang tải thành viên..." />
        ) : (
          <ul className="flex flex-wrap gap-3">
            {(membersQuery.data?.members ?? [])
              .slice(0, 24)
              .map((entry) => {
                const m = entry.member ?? entry;
                return (
                  <li
                    key={m.id}
                    className="flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5"
                  >
                    <Avatar size="xs" name={m.fullName} src={m.avatarUrl} />
                    <span className="text-sm font-medium text-neutral-800">
                      {m.fullName}
                    </span>
                  </li>
                );
              })}
          </ul>
        )}
      </Card>

      <Card padding="lg">
        <EventGallery eventId={eventId} />
      </Card>

      <ConfirmDialog
        open={confirmDelete}
        title="Xoá sự kiện?"
        description="Sự kiện và tất cả ảnh liên quan sẽ bị xoá vĩnh viễn."
        confirmText="Xoá"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />

      <p className="text-xs text-neutral-400">
        Cập nhật lần cuối: {formatDate(event.updatedAt)}
      </p>
    </div>
  );
}