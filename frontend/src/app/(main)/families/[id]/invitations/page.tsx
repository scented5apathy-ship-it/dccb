'use client';

import { useMemo, useRef, useState } from 'react';
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
import { Modal } from '@/components/ui/Modal';
import { QrCode, downloadNodeAsPng, downloadQrPng } from '@/components/ui/QrCode';
import { Download, ImageDown } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { Input } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useInvitations, useRevokeInvitation } from '@/hooks/useMembers';
import { useFamily } from '@/hooks/useFamily';
import { usePermission } from '@/hooks/usePermission';
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
  const { isAdmin, canInvite } = usePermission(familyId);
  const canManageInvitations = isAdmin && canInvite;
  const [filter, setFilter] = useState<InvitationStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<InvitationDetail | null>(null);
  const [qrInvite, setQrInvite] = useState<InvitationDetail | null>(null);

  const allInvitations: InvitationDetail[] = useMemo(
    () => data?.invitations ?? [],
    [data?.invitations]
  );

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
        {canManageInvitations && (
        <Link href={`/families/${familyId}`}>
          <Button leftIcon={<Send className="h-4 w-4" />}>
            Mời thành viên mới
          </Button>
        </Link>
        )}
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
              canManageInvitations ? (
              <Link href={`/families/${familyId}`}>
                <Button leftIcon={<Send className="h-4 w-4" />}>
                  Tạo lời mời đầu tiên
                </Button>
              </Link>
              ) : undefined
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
              canRevoke={canManageInvitations}
              onCopy={(text) => handleCopy(text, inv.id)}
              onRevoke={() => setRevokeTarget(inv)}
              onQr={() => setQrInvite(inv)}
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

      <QrPopup
        invite={qrInvite}
        onClose={() => setQrInvite(null)}
        familyName={familyData?.family.name}
        inviterName={qrInvite?.inviterName}
      />
    </div>
  );
}

// ---------- QR popup ----------
interface QrPopupProps {
  invite: InvitationDetail | null;
  onClose: () => void;
  familyName?: string;
  inviterName?: string;
}

function QrPopup({ invite, onClose, familyName, inviterName }: QrPopupProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  if (!invite) return null;
  const expires = invite.expiresAt ? new Date(invite.expiresAt) : null;
  const accepted = invite.status === 'ACCEPTED';
  const expired = invite.status === 'EXPIRED';
  const revoked = invite.status === 'REVOKED';

  // Copy-to-clipboard helper with a brief inline visual confirmation.
  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast.success(`Đã sao chép ${label}`);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      showToast.error('Không thể sao chép');
    }
  };

  const handleDownloadCard = async () => {
    const node = cardRef.current;
    if (!node) return;
    try {
      await downloadNodeAsPng(
        node,
        `thiep-moi-${invite.inviteCode}.png`
      );
      showToast.success('Đã tải thiệp mời về máy');
    } catch (err) {
      showToast.error(
        err instanceof Error ? err.message : 'Không thể tải thiệp'
      );
    }
  };

  const handleDownloadQrOnly = async () => {
    try {
      await downloadQrPng(invite.inviteUrl, `qr-${invite.inviteCode}.png`);
      showToast.success('Đã tải QR về máy');
    } catch (err) {
      showToast.error(
        err instanceof Error ? err.message : 'Không thể tải QR'
      );
    }
  };

  return (
    <Modal open onClose={onClose} title="QR mã mời" size="md">
      <div className="space-y-5">
        {/* The card that gets exported as a single PNG when the user clicks
            "Tải thiệp mời". Keep its layout self-contained (no Tailwind
            gradients that html-to-image can't render) so the exported image
            looks identical. */}
        <div
          ref={cardRef}
          className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
          style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #ffffff 50%, #fff1f2 100%)' }}
        >
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-widest text-amber-700">
              Lời mời tham gia gia đình
            </p>
            {familyName && (
              <h2 className="mt-1 font-serif text-2xl font-semibold text-neutral-900">
                {familyName}
              </h2>
            )}
            {inviterName && (
              <p className="mt-1 text-sm text-neutral-600">
                Mời bởi <span className="font-medium">{inviterName}</span>
              </p>
            )}
          </div>

          <div className="flex justify-center">
            <div className="rounded-xl bg-white p-3 shadow ring-1 ring-neutral-200">
              <QrCode
                value={invite.inviteUrl}
                size={200}
                ariaLabel={`QR code cho lời mời ${invite.inviteCode}`}
              />
            </div>
          </div>

          <div>
            <p className="mb-1 text-center text-xs font-medium uppercase tracking-wider text-neutral-500">
              Mã mời
            </p>
            <div className="select-all rounded-lg border-2 border-dashed border-neutral-300 bg-white px-3 py-3 text-center font-mono text-2xl font-bold tracking-[0.35em] text-neutral-900">
              {invite.inviteCode}
            </div>
          </div>

          <div className="space-y-1 text-center text-xs text-neutral-500">
            <p>Quét QR hoặc nhập mã trên trang tham gia gia đình.</p>
            <p className="break-all font-mono text-[11px] text-neutral-400">
              {invite.inviteUrl}
            </p>
          </div>

          {expires && (
            <p
              className={`text-center text-xs ${
                expired ? 'text-red-700' : 'text-amber-800'
              }`}
            >
              {accepted
                ? 'Đã được chấp nhận'
                : expired
                  ? 'Đã hết hạn'
                  : revoked
                    ? 'Đã thu hồi'
                    : `Hết hạn: ${expires.toLocaleString('vi-VN')}`}
            </p>
          )}
        </div>

        {/* Click-to-copy invite code (a nicer alternative to the
            select-all + ⌘C dance). */}
        <button
          type="button"
          onClick={() => copy(invite.inviteCode, 'mã mời')}
          className="group flex w-full items-center gap-2 rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2.5 text-left transition-colors hover:border-primary-300 hover:bg-primary-50"
          aria-label="Click để sao chép mã mời"
        >
          <span className="flex-1 text-center font-mono text-lg font-semibold tracking-widest text-neutral-900">
            {invite.inviteCode}
          </span>
          <span
            className={`flex items-center gap-1 text-xs font-medium ${
              codeCopied ? 'text-emerald-600' : 'text-neutral-500 group-hover:text-primary-600'
            }`}
          >
            {codeCopied ? (
              <>
                <Check className="h-3.5 w-3.5" /> Đã sao chép
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" /> Sao chép
              </>
            )}
          </span>
        </button>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">
            Đường dẫn mời
          </label>
          <div
            className="truncate rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700"
            onClick={() => copy(invite.inviteUrl, 'đường dẫn')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                copy(invite.inviteUrl, 'đường dẫn');
              }
            }}
          >
            {invite.inviteUrl}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownloadQrOnly}
            leftIcon={<Download className="h-3.5 w-3.5" />}
          >
            Tải QR
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleDownloadCard}
            leftIcon={<ImageDown className="h-3.5 w-3.5" />}
          >
            Tải thiệp mời
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ---------- Row component ----------
interface InvitationRowProps {
  invite: InvitationDetail;
  copied: boolean;
  canRevoke?: boolean;
  onCopy: (text: string) => void;
  onRevoke: () => void;
  onQr: () => void;
}

function InvitationRow({ invite, copied, canRevoke = true, onCopy, onRevoke, onQr }: InvitationRowProps) {
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
          {onQr && (
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<QrCodeIcon className="h-3.5 w-3.5" />}
              onClick={() => onQr()}
            >
              QR
            </Button>
          )}
          {invite.status === 'PENDING' && canRevoke && (
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