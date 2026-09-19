'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Copy,
  Check,
  Clock,
  X,
  Search,
  Send,
  UserCheck,
  Ban,
  Hourglass,
  QrCode as QrCodeIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { Input } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useInvitations, useRevokeInvitation } from '@/hooks/useMembers';
import { useFamily } from '@/hooks/useFamily';
import { showToast } from '@/components/ui/Toast';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import type { InvitationDetail, InvitationStatus } from '@/types/family';

const STATUS_META: Record<
  InvitationStatus,
  { label: string; tone: 'primary' | 'success' | 'warning' | 'danger'; icon: typeof Mail }
> = {
  PENDING: { label: 'Đang chờ', tone: 'warning', icon: Hourglass },
  ACCEPTED: { label: 'Đã tham gia', tone: 'success', icon: UserCheck },
  EXPIRED: { label: 'Hết hạn', tone: 'danger', icon: Clock },
  REVOKED: { label: 'Đã thu hồi', tone: 'danger', icon: Ban },
};

export default function InvitationsPage() {
  const params = useParams<{ id: string }>();
  const familyId = params.id;
  const { data: familyData } = useFamily(familyId);
  const { data, isLoading } = useInvitations(familyId);
  const revokeMutation = useRevokeInvitation();
  const [filter, setFilter] = useState<InvitationStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<InvitationDetail | null>(null);

  const allInvitations: InvitationDetail[] = data?.invitations ?? [];

  const filtered = useMemo(() => {
    return allInvitations.filter((inv) => {
      if (filter !== 'ALL' && inv.status !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !inv.inviteeEmail.toLowerCase().includes(q) &&
          !(inv.inviteeName ?? '').toLowerCase().includes(q) &&
          !(inv.inviterName ?? '').toLowerCase().includes(q) &&
          !inv.inviteCode.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [allInvitations, filter, search]);

  const counts = useMemo(() => {
    const c: Record<InvitationStatus | 'ALL', number> = {
      ALL: allInvitations.length,
      PENDING: 0,
      ACCEPTED: 0,
      EXPIRED: 0,
      REVOKED: 0,
    };
    allInvitations.forEach((i) => (c[i.status] = (c[i.status] ?? 0) + 1));
    return c;
  }, [allInvitations]);

  const handleCopy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      showToast.error('Không thể sao chép');
    }
  };

  const handleRevoke = async (inv: InvitationDetail): Promise<void> => {
    try {
      await revokeMutation.mutateAsync({
        invitationId: inv.id,
        familyId,
      });
      showToast.success(`Đã thu hồi lời mời tới ${inv.inviteeEmail}`);
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : 'Thu hồi thất bại');
    } finally {
      setRevokeTarget(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Link
            href={`/families/${familyId}`}
            className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-neutral-200 text-neutral-700 transition-colors hover:bg-neutral-50"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="flex items-center gap-2 font-serif text-2xl font-semibold text-neutral-900">
              <Mail className="h-6 w-6 text-primary-600" />
              Lịch sử lời mời
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              {familyData?.family.name
                ? `Gia tộc ${familyData.family.name}`
                : 'Đang tải…'}
              {' · '}
              {filtered.length}/{allInvitations.length} lời mời
            </p>
          </div>
        </div>
        <Link href={`/families/${familyId}`}>
          <Button leftIcon={<Send className="h-4 w-4" />}>
            Mời thành viên mới
          </Button>
        </Link>
      </div>

      {/* Stats + filters */}
      <Card padding="md">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {(['ALL', 'PENDING', 'ACCEPTED', 'EXPIRED', 'REVOKED'] as const).map(
            (status) => {
              const meta =
                status === 'ALL'
                  ? { label: 'Tất cả', icon: Mail }
                  : { ...STATUS_META[status], icon: STATUS_META[status].icon };
              const Icon = meta.icon;
              const isActive = filter === status;
              return (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors ${
                    isActive
                      ? 'border-primary-300 bg-primary-50'
                      : 'border-neutral-200 bg-white hover:border-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-neutral-500" />
                    <span className="text-xs font-medium text-neutral-600">
                      {meta.label}
                    </span>
                  </div>
                  <span className="text-xl font-semibold text-neutral-900">
                    {counts[status] ?? 0}
                  </span>
                </button>
              );
            }
          )}
        </div>
        <div className="mt-4">
          <Input
            placeholder="Tìm theo email, tên hoặc mã mời…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
      </Card>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Spinner size="lg" label="Đang tải lời mời..." />
        </div>
      ) : allInvitations.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon={<Mail className="h-10 w-10" />}
            title="Chưa có lời mời nào"
            description="Khi bạn mời thành viên, mọi lời mời (kể cả đã hết hạn) sẽ xuất hiện ở đây."
            action={
              <Link href={`/families/${familyId}`}>
                <Button leftIcon={<Send className="h-4 w-4" />}>
                  Tạo lời mời đầu tiên
                </Button>
              </Link>
            }
          />
        </Card>
      ) : filtered.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon={<Search className="h-10 w-10" />}
            title="Không có kết quả"
            description="Thử đổi bộ lọc hoặc từ khoá khác."
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((inv) => (
            <InvitationRow
              key={inv.id}
              invite={inv}
              copied={copiedId === inv.id}
              onCopy={(text) => handleCopy(text, inv.id)}
              onRevoke={() => setRevokeTarget(inv)}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        open={revokeTarget !== null}
        onCancel={() => setRevokeTarget(null)}
        onConfirm={() => {
          if (revokeTarget) void handleRevoke(revokeTarget);
        }}
        title="Thu hồi lời mời?"
        description={
          revokeTarget
            ? `Mã mời tới ${revokeTarget.inviteeEmail} sẽ bị vô hiệu hoá ngay lập tức. Hành động này không thể hoàn tác.`
            : ''
        }
        confirmText="Thu hồi"
        variant="danger"
        loading={revokeMutation.isPending}
      />
    </div>
  );
}

// ---------- Row component ----------
interface InvitationRowProps {
  invite: InvitationDetail;
  copied: boolean;
  onCopy: (text: string) => void;
  onRevoke: () => void;
}

function InvitationRow({ invite, copied, onCopy, onRevoke }: InvitationRowProps) {
  const meta = STATUS_META[invite.status];
  const Icon = meta.icon;
  const expires = invite.expiresAt ? new Date(invite.expiresAt) : null;
  const accepted = invite.acceptedAt ? new Date(invite.acceptedAt) : null;
  const created = invite.createdAt ? new Date(invite.createdAt) : null;

  return (
    <Card padding="md" className="transition-all hover:border-primary-200">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
              invite.status === 'ACCEPTED'
                ? 'bg-emerald-100 text-emerald-600'
                : invite.status === 'PENDING'
                ? 'bg-amber-100 text-amber-600'
                : 'bg-neutral-100 text-neutral-500'
            }`}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-neutral-900">
                {invite.inviteeName || invite.inviteeEmail}
              </p>
              <Badge variant={meta.tone}>{meta.label}</Badge>
              {invite.role && (
                <Badge variant="default">{invite.role}</Badge>
              )}
            </div>
            {invite.inviteeName && (
              <p className="text-xs text-neutral-500">{invite.inviteeEmail}</p>
            )}
            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
              {invite.inviterName && <span>Mời bởi {invite.inviterName}</span>}
              {created && <span>Tạo {formatRelativeTime(created)}</span>}
              {expires && invite.status === 'PENDING' && (
                <span className="text-amber-700">
                  Hết hạn {formatDate(expires)}
                </span>
              )}
              {accepted && (
                <span className="text-emerald-700">
                  Tham gia {formatRelativeTime(accepted)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCopy(invite.inviteUrl)}
            leftIcon={
              copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )
            }
          >
            {copied ? 'Đã sao chép' : 'Sao chép link'}
          </Button>
          <Link
            href={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(invite.inviteUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="ghost" size="sm" leftIcon={<QrCodeIcon className="h-3.5 w-3.5" />}>
              QR
            </Button>
          </Link>
          {invite.status === 'PENDING' && (
            <Button
              variant="danger"
              size="sm"
              onClick={onRevoke}
              leftIcon={<X className="h-3.5 w-3.5" />}
            >
              Thu hồi
            </Button>
          )}
        </div>
      </div>

      {/* Code preview */}
      <div className="mt-3 flex items-center gap-2 rounded-md border border-dashed border-neutral-200 bg-neutral-50 px-2 py-1.5 font-mono text-xs text-neutral-600">
        <span className="text-neutral-400">Mã:</span>
        <span className="select-all tracking-wider">{invite.inviteCode}</span>
      </div>
    </Card>
  );
}