'use client';

import { useEffect, useState } from 'react';
import {
  Lock,
  Sparkles,
  X,
  CalendarDays,
  Clock,
  Gift,
  Hourglass,
  Unlock,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Spinner } from '@/components/ui/Spinner';
import { showToast } from '@/components/ui/Toast';
import { useOpenTimeCapsule } from '@/hooks/useTimeCapsules';
import type { TimeCapsuleEntry } from '@/types/time-capsule';
import { formatDate, formatDateTime, cn } from '@/lib/utils';

export interface OpenTimeCapsuleModalProps {
  open: boolean;
  entry: TimeCapsuleEntry | null;
  /** Optional family context (currently unused, kept for future routing). */
  familyId?: string;
  onClose: () => void;
  onDelete?: (id: string) => Promise<void> | void;
}

/**
 * Modal that simulates "opening" a time capsule. For capsules that are
 * still sealed we ask the user to confirm before calling the open
 * endpoint. The contents are then revealed inside the modal.
 */
export function OpenTimeCapsuleModal({
  open,
  entry,
  onClose,
  onDelete,
}: OpenTimeCapsuleModalProps) {
  const openMutation = useOpenTimeCapsule();
  const [revealed, setRevealed] = useState<{
    id: string;
    title: string;
    content?: string;
    mediaUrl?: string;
  } | null>(null);

  // Trigger a reveal animation each time we enter revealed state
  const [justOpened, setJustOpened] = useState(false);

  useEffect(() => {
    if (revealed) {
      setJustOpened(true);
      const id = window.setTimeout(() => setJustOpened(false), 1600);
      return () => window.clearTimeout(id);
    }
    return undefined;
    // revealed.id is intentional — we want to fire the reveal animation
    // each time a different capsule is opened, not on every state change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed?.id]);

  if (!entry) {
    return (
      <Modal open={open} onClose={onClose} title="Hộp thời gian">
        <p className="text-sm text-neutral-500">Không tìm thấy hộp thời gian.</p>
      </Modal>
    );
  }

  const status = entry.capsule.isOpened
    ? 'opened'
    : entry.isUnlockable
      ? 'available'
      : 'sealed';

  const isOpened = status === 'opened';
  const handleUnlock = async () => {
    try {
      const data = await openMutation.mutateAsync(entry.capsule.id);
      setRevealed({
        id: entry.capsule.id,
        title: entry.capsule.title,
        content: data?.content ?? entry.capsule.content,
        mediaUrl: entry.capsule.mediaUrl,
      });
      showToast.success('Bạn vừa mở một hộp thời gian!');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Không thể mở hộp thời gian';
      showToast.error('Mở thất bại', { description: message });
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    if (!confirm('Bạn có chắc muốn xoá hộp thời gian này?')) return;
    try {
      await onDelete(entry.capsule.id);
      showToast.success('Đã xoá hộp thời gian');
      onClose();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Không thể xoá';
      showToast.error('Xoá thất bại', { description: message });
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        setRevealed(null);
        onClose();
      }}
      size="lg"
      title={revealed ? revealed.title : entry.capsule.title}
      description={
        revealed
          ? `Mở vào ${formatDateTime(entry.capsule.unlockDate)}`
          : `Tạo bởi ${entry.creator?.fullName ?? '—'} · ${formatDate(entry.capsule.createdAt)}`
      }
    >
      {!revealed ? (
        <div className="space-y-4">
          {/* Envelope / seal hero */}
          <div className="flex items-center gap-4 rounded-2xl border-2 border-amber-200/70 bg-gradient-to-br from-amber-50/70 via-orange-50/40 to-amber-100/50 p-4 shadow-soft">
            <div className="relative">
              <div
                className={cn(
                  'relative flex h-16 w-16 items-center justify-center rounded-full text-white shadow-medium ring-2 ring-white',
                  status === 'sealed'
                    ? 'bg-gradient-to-br from-red-700 via-red-600 to-red-800'
                    : status === 'available'
                      ? 'bg-gradient-to-br from-amber-500 via-amber-400 to-amber-600'
                      : 'bg-gradient-to-br from-stone-600 via-stone-500 to-stone-700'
                )}
              >
                {status === 'sealed' ? (
                  <Lock className="h-7 w-7" strokeWidth={2.5} />
                ) : status === 'available' ? (
                  <Unlock className="h-7 w-7" strokeWidth={2.5} />
                ) : (
                  <Sparkles className="h-7 w-7" strokeWidth={2.5} />
                )}
                <span className="absolute inset-1 rounded-full border-2 border-dashed border-white/40" />
              </div>
              {status === 'sealed' && (
                <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-[9px] font-bold uppercase tracking-wider text-amber-800 ring-2 ring-white">
                  NIÊM
                </span>
              )}
              {status === 'available' && (
                <span className="absolute -bottom-1 -right-1 flex h-6 w-6 animate-pulse items-center justify-center rounded-full bg-amber-100 text-[9px] font-bold uppercase tracking-wider text-amber-800 ring-2 ring-white">
                  MỞ
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-serif text-base font-semibold text-neutral-900">
                {status === 'sealed'
                  ? 'Niêm phong - không thể mở'
                  : status === 'available'
                    ? 'Sẵn sàng mở khoá'
                    : 'Đã mở trước đó'}
              </p>
              <p className="text-xs text-neutral-600">
                {status === 'sealed'
                  ? 'Hộp vẫn đang được niêm phong. Hãy quay lại khi đến ngày mở.'
                  : status === 'available'
                    ? 'Đã đến ngày mở. Bạn có thể khám phá nội dung bên trong ngay.'
                    : 'Nội dung đã được tiết lộ, có thể xem lại bất kỳ lúc nào.'}
              </p>
            </div>
            <Badge
              variant={
                status === 'opened'
                  ? 'success'
                  : status === 'available'
                    ? 'info'
                    : 'warning'
              }
            >
              {status === 'opened'
                ? 'Đã mở'
                : status === 'available'
                  ? 'Sẵn sàng mở'
                  : 'Đang niêm phong'}
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <Avatar
              size="md"
              name={entry.creator?.fullName ?? '—'}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-neutral-900">
                {entry.creator?.fullName ?? '—'}
              </p>
              <p className="text-xs text-neutral-500">
                Người gửi · {entry.recipient?.fullName
                  ? `Gửi tới ${entry.recipient.fullName}`
                  : 'Không chỉ định người nhận'}
              </p>
            </div>
          </div>

          <div className="grid gap-3 rounded-xl border border-primary-100 bg-primary-50/30 p-4 sm:grid-cols-3">
            <MetaItem
              icon={<CalendarDays className="h-4 w-4" />}
              label="Ngày mở"
              value={
                entry.capsule.unlockDate
                  ? formatDate(entry.capsule.unlockDate)
                  : '—'
              }
            />
            <MetaItem
              icon={<Clock className="h-4 w-4" />}
              label="Điều kiện"
              value={
                entry.capsule.unlockCondition === 'DATE'
                  ? 'Theo ngày'
                  : entry.capsule.unlockCondition === 'EVENT'
                    ? `Sự kiện: ${entry.capsule.unlockEvent || '—'}`
                    : 'Thủ công'
              }
            />
            <MetaItem
              icon={entry.recipient?.fullName ? <Gift className="h-4 w-4" /> : <Hourglass className="h-4 w-4" />}
              label="Người nhận"
              value={entry.recipient?.fullName ?? 'Cả gia đình'}
            />
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-3">
            {onDelete && (
              <Button variant="ghost" onClick={handleDelete}>
                Xoá
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Đóng
            </Button>
            <Button
              onClick={handleUnlock}
              loading={openMutation.isPending}
              disabled={!isOpened && status === 'sealed'}
              leftIcon={
                status === 'opened' ? (
                  <Sparkles className="h-4 w-4" />
                ) : status === 'available' ? (
                  <Unlock className="h-4 w-4" />
                ) : (
                  <Lock className="h-4 w-4" />
                )
              }
            >
              {status === 'opened' ? 'Xem lại nội dung' : 'Mở khoá'}
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            'space-y-4',
            justOpened && 'animate-[reveal-letter_1.2s_ease-out]'
          )}
        >
          {/* Reveal banner */}
          <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium text-amber-900">
              <Sparkles className="h-4 w-4 animate-pulse text-amber-600" />
              Lời nhắn từ {entry.creator?.fullName ?? '—'}
            </div>
            <span className="text-xs text-amber-700">
              Mở {formatDateTime(entry.capsule.openedAt ?? entry.capsule.unlockDate)}
            </span>
          </div>

          {revealed.mediaUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={revealed.mediaUrl}
              alt=""
              className="max-h-72 w-full rounded-xl border border-amber-200 object-cover shadow-medium"
            />
          )}

          <div
            className={cn(
              'whitespace-pre-wrap rounded-xl border-2 border-amber-200/60 bg-gradient-to-br from-amber-50/80 via-orange-50/50 to-amber-50/80 p-5 font-serif text-base leading-relaxed text-neutral-800 shadow-soft',
              'relative overflow-hidden'
            )}
          >
            {/* Decorative quote marks */}
            <span
              className="pointer-events-none absolute -left-2 -top-3 font-serif text-6xl text-amber-300/60"
              aria-hidden="true"
            >
              &ldquo;
            </span>
            <span
              className="pointer-events-none absolute -bottom-6 -right-2 font-serif text-6xl text-amber-300/60"
              aria-hidden="true"
            >
              &rdquo;
            </span>
            <div className="relative">
              {revealed.content || (
                <span className="italic text-neutral-500">
                  (Không có nội dung lời nhắn)
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-3">
            <Button
              variant="outline"
              onClick={() => {
                setRevealed(null);
                onClose();
              }}
              leftIcon={<X className="h-4 w-4" />}
            >
              Đóng
            </Button>
          </div>

          {openMutation.isPending && <Spinner />}
        </div>
      )}
    </Modal>
  );
}

interface MetaItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}

function MetaItem({ icon, label, value }: MetaItemProps) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-500">
          {label}
        </p>
        <p className="truncate text-sm font-medium text-neutral-900">{value}</p>
      </div>
    </div>
  );
}

export default OpenTimeCapsuleModal;