'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Plus, Filter, Clock, Home } from 'lucide-react';
import { familyApi } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { TimeCapsuleCard } from '@/components/time-capsule/TimeCapsuleCard';
import { CreateTimeCapsuleForm } from '@/components/time-capsule/CreateTimeCapsuleForm';
import { OpenTimeCapsuleModal } from '@/components/time-capsule/OpenTimeCapsuleModal';
import {
  useTimeCapsules,
  useDeleteTimeCapsule,
} from '@/hooks/useTimeCapsules';
import { useAuth } from '@/hooks/useAuth';
import type { TimeCapsuleEntry } from '@/types/time-capsule';
import type { ListTimeCapsulesParams } from '@/lib/api-client';
import { cn } from '@/lib/utils';

const FILTER_OPTIONS: Array<{
  value: ListTimeCapsulesParams['status'];
  label: string;
}> = [
  { value: undefined, label: 'Tất cả' },
  { value: 'sealed', label: 'Đang niêm phong' },
  { value: 'available', label: 'Sẵn sàng mở' },
  { value: 'opened', label: 'Đã mở' },
];

export default function TimeCapsulesPage() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] =
    useState<ListTimeCapsulesParams['status']>(undefined);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<TimeCapsuleEntry | null>(null);

  // Fetch user's families to pick the first one for the demo (this is the
  // global page; in a real multi-family product we'd let the user choose).
  const familiesQuery = useQuery({
    queryKey: ['families', 'list'],
    queryFn: () => familyApi.list(),
    enabled: Boolean(user),
  });

  const familyId = familiesQuery.data?.families?.[0]?.family?.id;

  // Always fetch the unfiltered list so the filter chips can show
  // accurate counts for every status at the same time.
  const allCapsulesQuery = useTimeCapsules(familyId);
  const capsulesQuery = useTimeCapsules(familyId, {
    status: statusFilter,
  });

  const deleteMutation = useDeleteTimeCapsule();

  // Counts come from the unfiltered list so every chip shows the right number.
  const allEntries = allCapsulesQuery.data?.capsules ?? [];
  const entries = capsulesQuery.data?.capsules ?? [];

  const counts = useMemo(() => {
    return {
      total: allEntries.length,
      sealed: allEntries.filter(
        (e) => !e.capsule.isOpened && !e.isUnlockable
      ).length,
      available: allEntries.filter(
        (e) => !e.capsule.isOpened && e.isUnlockable
      ).length,
      opened: allEntries.filter((e) => e.capsule.isOpened).length,
    };
  }, [allEntries]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-serif text-2xl font-semibold text-neutral-900">
            <Clock className="h-6 w-6 text-primary-600" />
            Hộp thời gian
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Niêm phong lời nhắn, video, hình ảnh và mở chúng vào một ngày đặc
            biệt trong tương lai.
          </p>
        </div>
        {familyId ? (
          <Button
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setCreateOpen(true)}
          >
            Tạo hộp thời gian
          </Button>
        ) : (
          <Link href="/families/new">
            <Button leftIcon={<Home className="h-4 w-4" />} variant="outline">
              Tạo gia đình để bắt đầu
            </Button>
          </Link>
        )}
      </header>

      <Card padding="sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
            <Filter className="h-3.5 w-3.5" /> Lọc:
          </span>
          {FILTER_OPTIONS.map((opt) => {
            const active = statusFilter === opt.value;
            const count =
              opt.value === undefined
                ? counts.total
                : opt.value === 'sealed'
                  ? counts.sealed
                  : opt.value === 'available'
                    ? counts.available
                    : counts.opened;
            return (
              <button
                key={opt.label}
                type="button"
                onClick={() => setStatusFilter(opt.value)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  active
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                )}
              >
                {opt.label}
                <Badge variant="default" size="sm">
                  {count}
                </Badge>
              </button>
            );
          })}
        </div>
      </Card>

      {!familyId && !familiesQuery.isLoading && (
        <EmptyState
          icon={<Clock className="h-8 w-8" />}
          title="Chưa có gia đình nào"
          description="Hãy tạo hoặc tham gia một gia đình trước khi niêm phong hộp thời gian."
          action={
            <Link href="/families/new">
              <Button leftIcon={<Home className="h-4 w-4" />}>
                Tạo gia đình
              </Button>
            </Link>
          }
        />
      )}

      {capsulesQuery.isLoading && (
        <div className="flex min-h-[30vh] items-center justify-center">
          <Spinner size="lg" label="Đang tải hộp thời gian..." />
        </div>
      )}

      {capsulesQuery.error && (
        <Card padding="md" className="border-red-200 bg-red-50 text-red-700">
          Không thể tải hộp thời gian:{' '}
          {(capsulesQuery.error as Error)?.message}
        </Card>
      )}

      {familyId && !capsulesQuery.isLoading && entries.length === 0 && (
        <EmptyState
          icon={<Clock className="h-8 w-8" />}
          title="Chưa có hộp thời gian nào"
          description="Tạo hộp đầu tiên và gửi gắm lời nhắn cho thế hệ tương lai."
          action={
            <Button onClick={() => setCreateOpen(true)} leftIcon={<Plus className="h-4 w-4" />}>
              Tạo hộp thời gian
            </Button>
          }
        />
      )}

      {entries.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <TimeCapsuleCard
              key={entry.capsule.id}
              entry={entry}
              familyId={familyId}
              onClick={() => setSelected(entry)}
            />
          ))}
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Tạo hộp thời gian mới"
        size="lg"
        description="Lời nhắn sẽ được niêm phong cho đến ngày bạn chọn."
      >
        {familyId ? (
          <CreateTimeCapsuleForm
            familyId={familyId}
            onSuccess={() => setCreateOpen(false)}
          />
        ) : (
          <p className="text-sm text-neutral-500">
            Vui lòng chọn một gia đình trước.
          </p>
        )}
      </Modal>

      <OpenTimeCapsuleModal
        open={Boolean(selected)}
        entry={selected}
        familyId={familyId}
        onClose={() => setSelected(null)}
        onDelete={async (id) => {
          await deleteMutation.mutateAsync({ id, familyId });
        }}
      />
    </div>
  );
}