'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Plus, Filter } from 'lucide-react';
import { familyApi } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { EventCard } from '@/components/event/EventCard';
import { CreateEventForm } from '@/components/event/CreateEventForm';
import { useEvents } from '@/hooks/useEvents';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import type { ListEventsParams } from '@/lib/api-client';

type Tab = 'upcoming' | 'past';

const TYPE_OPTIONS: Array<{ value: string | undefined; label: string }> = [
  { value: undefined, label: 'Tất cả' },
  { value: 'WEDDING', label: 'Đám cưới' },
  { value: 'FUNERAL', label: 'Tang lễ' },
  { value: 'BIRTHDAY', label: 'Sinh nhật' },
  { value: 'ANNIVERSARY', label: 'Kỷ niệm' },
  { value: 'REUNION', label: 'Đoàn tụ' },
  { value: 'HOLIDAY', label: 'Lễ hội' },
  { value: 'OTHER', label: 'Khác' },
];

export default function EventsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('upcoming');
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [createOpen, setCreateOpen] = useState(false);

  const familiesQuery = useQuery({
    queryKey: ['families', 'list'],
    queryFn: () => familyApi.list(),
    enabled: Boolean(user),
  });
  const familyId = familiesQuery.data?.families?.[0]?.family?.id;

  const filters: ListEventsParams = useMemo(
    () => ({
      type: typeFilter,
      upcoming: tab === 'upcoming' ? true : undefined,
      past: tab === 'past' ? true : undefined,
      size: 50,
    }),
    [typeFilter, tab]
  );

  const eventsQuery = useEvents(familyId, filters);
  const entries = eventsQuery.data?.events ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-serif text-2xl font-semibold text-neutral-900">
            <Calendar className="h-6 w-6 text-primary-600" />
            Sự kiện
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Các sự kiện gia đình - đám cưới, tang lễ, sinh nhật, đoàn tụ.
          </p>
        </div>
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setCreateOpen(true)}
          disabled={!familyId}
        >
          Tạo sự kiện
        </Button>
      </header>

      <Card padding="sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
            <Filter className="h-3.5 w-3.5" />
            Chế độ xem:
          </span>
          {(['upcoming', 'past'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                tab === t
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              )}
            >
              {t === 'upcoming' ? 'Sắp tới' : 'Đã qua'}
            </button>
          ))}
          <span className="ml-3 inline-flex items-center gap-1 text-xs text-neutral-500">
            Loại:
          </span>
          {TYPE_OPTIONS.map((opt) => {
            const active = typeFilter === opt.value;
            return (
              <button
                key={opt.label}
                type="button"
                onClick={() => setTypeFilter(opt.value)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  active
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                )}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </Card>

      {!familyId && !familiesQuery.isLoading && (
        <EmptyState
          icon={<Calendar className="h-8 w-8" />}
          title="Chưa có gia đình nào"
          description="Hãy tạo hoặc tham gia một gia đình trước khi thêm sự kiện."
        />
      )}

      {eventsQuery.isLoading && (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner size="lg" label="Đang tải sự kiện..." />
        </div>
      )}

      {eventsQuery.error && (
        <Card padding="md" className="border-red-200 bg-red-50 text-red-700">
          Không thể tải sự kiện: {(eventsQuery.error as Error)?.message}
        </Card>
      )}

      {familyId && !eventsQuery.isLoading && entries.length === 0 && (
        <EmptyState
          icon={<Calendar className="h-8 w-8" />}
          title={
            tab === 'upcoming' ? 'Chưa có sự kiện sắp tới' : 'Chưa có sự kiện đã qua'
          }
          description="Tạo sự kiện đầu tiên để bắt đầu lên kế hoạch."
          action={
            <Button onClick={() => setCreateOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>
              Tạo sự kiện
            </Button>
          }
        />
      )}

      {entries.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <EventCard
              key={entry.event.id}
              entry={entry}
              familyId={familyId}
            />
          ))}
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Tạo sự kiện mới"
        size="lg"
        description="Mời cả gia đình tham dự."
      >
        {familyId ? (
          <CreateEventForm
            familyId={familyId}
            onSuccess={() => setCreateOpen(false)}
          />
        ) : (
          <p className="text-sm text-neutral-500">
            Vui lòng chọn một gia đình trước.
          </p>
        )}
      </Modal>
    </div>
  );
}