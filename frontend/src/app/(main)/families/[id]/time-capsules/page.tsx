'use client';

import { useState } from 'react';
import { Plus, Clock, Filter } from 'lucide-react';
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
import type { TimeCapsuleEntry } from '@/types/time-capsule';
import type { ListTimeCapsulesParams } from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface PageProps {
  params: { id: string };
}

const FILTER_OPTIONS: Array<{
  value: ListTimeCapsulesParams['status'];
  label: string;
}> = [
  { value: undefined, label: 'Tất cả' },
  { value: 'sealed', label: 'Đang niêm phong' },
  { value: 'available', label: 'Sẵn sàng mở' },
  { value: 'opened', label: 'Đã mở' },
];

export default function FamilyTimeCapsulesPage({ params }: PageProps) {
  const familyId = params.id;
  const [statusFilter, setStatusFilter] =
    useState<ListTimeCapsulesParams['status']>(undefined);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<TimeCapsuleEntry | null>(null);

  const capsulesQuery = useTimeCapsules(familyId, { status: statusFilter });
  const deleteMutation = useDeleteTimeCapsule();
  const entries = capsulesQuery.data?.capsules ?? [];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-serif text-2xl font-semibold text-neutral-900">
            <Clock className="h-6 w-6 text-primary-600" />
            Hộp thời gian của gia đình
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Những lời nhắn được niêm phong cho các thành viên trong gia đình.
          </p>
        </div>
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setCreateOpen(true)}
        >
          Tạo hộp thời gian
        </Button>
      </header>

      <Card padding="sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 text-xs text-neutral-500">
            <Filter className="h-3.5 w-3.5" /> Lọc:
          </span>
          {FILTER_OPTIONS.map((opt) => {
            const active = statusFilter === opt.value;
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
                  {opt.value === statusFilter ? entries.length : ''}
                </Badge>
              </button>
            );
          })}
        </div>
      </Card>

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

      {!capsulesQuery.isLoading && entries.length === 0 && (
        <EmptyState
          icon={<Clock className="h-8 w-8" />}
          title="Chưa có hộp thời gian nào"
          description="Bắt đầu lưu giữ những lời nhắn cho tương lai."
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
            <button
              key={entry.capsule.id}
              type="button"
              onClick={() => setSelected(entry)}
              className="text-left"
            >
              <TimeCapsuleCard entry={entry} familyId={familyId} />
            </button>
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
        <CreateTimeCapsuleForm
          familyId={familyId}
          onSuccess={() => setCreateOpen(false)}
        />
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