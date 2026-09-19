'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Trees,
  Users,
  UtensilsCrossed,
  BookOpen,
  Clock,
  Calendar,
  Edit,
  Share2,
  Mail,
  ArrowLeft,
  ArrowRight,
  MapPin,
  Calendar as CalendarIcon,
  Heart,
  ChefHat,
  Quote,
  Copy,
  Check,
  X,
  Download,
  ImageDown,
  QrCode as QrCodeIcon,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingState } from '@/components/shared/LoadingState';
import { useFamily, useUpdateFamily, useFamilyMembers } from '@/hooks/useFamily';
import { useGenerations } from '@/hooks/useGenerations';
import { useCreateInvitation } from '@/hooks/useMembers';
import { useAuth } from '@/hooks/useAuth';
import { useRecipes } from '@/hooks/useRecipes';
import { useStories } from '@/hooks/useStories';
import { useEvents } from '@/hooks/useEvents';
import { useTimeCapsules } from '@/hooks/useTimeCapsules';
import { showToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { QrCode, downloadNodeAsPng, downloadQrPng } from '@/components/ui/QrCode';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { CreateInvitationRequest, UpdateFamilyRequest } from '@/types/family';

const editSchema = z.object({
  name: z.string().min(1, 'Tên không được trống').max(200),
  description: z.string().max(1000).optional(),
  foundedYear: z
    .string()
    .optional()
    .refine(
      (v) => !v || (!Number.isNaN(Number(v)) && Number(v) >= 1000 && Number(v) <= new Date().getFullYear()),
      'Năm không hợp lệ'
    ),
  motto: z.string().max(255).optional(),
  originLocation: z.string().max(255).optional(),
});

const inviteSchema = z.object({
  inviteeEmail: z.string().email('Email không hợp lệ'),
  role: z.enum(['ADMIN', 'EDITOR', 'VIEWER']),
});

type TabKey =
  | 'overview'
  | 'tree'
  | 'members'
  | 'recipes'
  | 'stories'
  | 'timeCapsules'
  | 'events';

interface FamilyDetailPageProps {
  params: { id: string };
}

export default function FamilyDetailPage({ params }: FamilyDetailPageProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { data, isLoading, isError, error } = useFamily(params.id);
  const { data: generations } = useGenerations(params.id);
  const [tab, setTab] = useState<TabKey>('overview');
  const [editOpen, setEditOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [createdInvite, setCreatedInvite] = useState<{
    inviteCode: string;
    inviteUrl: string;
    expiresAt: string;
  } | null>(null);

  if (isLoading) return <LoadingState label="Đang tải thông tin gia đình..." />;
  if (isError || !data) {
    return (
      <Card padding="lg">
        <EmptyState
          icon={<Trees className="h-10 w-10" />}
          title="Không thể tải gia đình"
          description={
            error instanceof Error
              ? error.message
              : 'Vui lòng thử lại sau.'
          }
        />
        <div className="mt-4 text-center">
          <Button variant="outline" onClick={() => router.push('/families')}>
            Quay lại
          </Button>
        </div>
      </Card>
    );
  }

  const family = data.family;
  const stats = data.stats;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/families"
          className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700"
        >
          <ArrowLeft className="h-4 w-4" /> Danh sách gia đình
        </Link>
      </div>

      {/* Hero */}
      <Card padding="lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Avatar name={family.name} size="xl" src={family.logoUrl} />
            <div className="min-w-0">
              <h1 className="font-serif text-2xl font-semibold text-neutral-900">
                {family.name}
              </h1>
              {family.motto && (
                <p className="mt-1 flex items-center gap-1 text-sm italic text-primary-600">
                  <Heart className="h-3.5 w-3.5" />
                  &ldquo;{family.motto}&rdquo;
                </p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500">
                {family.originLocation && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {family.originLocation}
                  </span>
                )}
                {family.foundedYear && (
                  <span className="inline-flex items-center gap-1">
                    <CalendarIcon className="h-3.5 w-3.5" /> Thành lập{' '}
                    {family.foundedYear}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />{' '}
                  {family.memberCount ?? 0} thành viên
                </span>
                <Badge variant="primary" size="sm">
                  Vai trò: {data.role}
                </Badge>
              </div>
              {family.description && (
                <p className="mt-3 max-w-2xl text-sm text-neutral-600">
                  {family.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Share2 className="h-4 w-4" />}
              onClick={() => setInviteOpen(true)}
            >
              Mời thành viên
            </Button>
            <Link href={`/families/${params.id}/invitations`}>
              <Button variant="ghost" size="sm" leftIcon={<Mail className="h-4 w-4" />}>
                Lịch sử lời mời
              </Button>
            </Link>
            {(data.role === 'ADMIN' || data.role === 'admin') && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Edit className="h-4 w-4" />}
                onClick={() => setEditOpen(true)}
              >
                Chỉnh sửa
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          icon={<Users className="h-4 w-4" />}
          label="Thành viên"
          value={stats?.memberCount ?? family.memberCount ?? 0}
        />
        <StatTile
          icon={<Trees className="h-4 w-4" />}
          label="Đời"
          value={
            stats?.generationCount ??
            data.generations.length ??
            generations?.generations.length ??
            0
          }
        />
        <StatTile
          icon={<UtensilsCrossed className="h-4 w-4" />}
          label="Công thức"
          value={stats?.recipeCount ?? 0}
        />
        <StatTile
          icon={<BookOpen className="h-4 w-4" />}
          label="Câu chuyện"
          value={stats?.storyCount ?? 0}
        />
      </div>

      {/* Tabs */}
      <Card padding="none">
        <div className="flex flex-wrap gap-1 border-b border-neutral-100 px-4 pt-3">
          {TABS.map((t) => {
            const isActive = tab === t.key;
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 rounded-t-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-b-2 border-primary-600 text-primary-700'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                <Icon className="h-4 w-4" /> {t.label}
              </button>
            );
          })}
        </div>
        <div className="p-6">
          {tab === 'overview' && (
            <OverviewTab
              familyId={params.id}
              heritages={data.heritages ?? []}
              generations={data.generations ?? []}
            />
          )}
          {tab === 'tree' && <TreePreview familyId={params.id} />}
          {tab === 'members' && <MembersPreview familyId={params.id} />}
          {tab === 'recipes' && <RecipesPreview familyId={params.id} />}
          {tab === 'stories' && <StoriesPreview familyId={params.id} />}
          {tab === 'timeCapsules' && <TimeCapsulesPreview familyId={params.id} />}
          {tab === 'events' && <EventsPreview familyId={params.id} />}
        </div>
      </Card>

      <EditFamilyModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        family={family}
      />

      <InviteMemberModal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        familyId={params.id}
        onSuccess={(invite) => {
          setInviteOpen(false);
          setCreatedInvite(invite);
        }}
      />

      <InviteSuccessModal
        invite={createdInvite}
        onClose={() => setCreatedInvite(null)}
        familyName={family.name}
        inviterName={user?.fullName}
      />
    </div>
  );
}

const TABS: Array<{ key: TabKey; label: string; icon: typeof Trees }> = [
  { key: 'overview', label: 'Tổng quan', icon: Trees },
  { key: 'tree', label: 'Cây gia phả', icon: Trees },
  { key: 'members', label: 'Thành viên', icon: Users },
  { key: 'recipes', label: 'Công thức', icon: UtensilsCrossed },
  { key: 'stories', label: 'Câu chuyện', icon: BookOpen },
  { key: 'timeCapsules', label: 'Hộp thời gian', icon: Clock },
  { key: 'events', label: 'Sự kiện', icon: Calendar },
];

// ---------------- Tab Preview Components ----------------

interface FamilyPreviewProps {
  familyId: string;
}

interface PreviewLinkProps {
  familyId: string;
  href: string;
}

function PreviewLink({ familyId, href }: PreviewLinkProps) {
  return (
    <div className="mt-4 flex justify-end">
      <Link href={`/families/${familyId}${href}`}>
        <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
          Xem tất cả
        </Button>
      </Link>
    </div>
  );
}

function PreviewSection({
  isLoading,
  isEmpty,
  emptyTitle,
  emptyDescription,
  children,
  familyId,
  href,
}: {
  isLoading: boolean;
  isEmpty: boolean;
  emptyTitle: string;
  emptyDescription: string;
  children: React.ReactNode;
  familyId: string;
  href: string;
}) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-6">
        <Spinner size="md" label="Đang tải..." />
      </div>
    );
  }
  if (isEmpty) {
    return (
      <>
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          className="py-8"
        />
        <PreviewLink familyId={familyId} href={href} />
      </>
    );
  }
  return (
    <>
      {children}
      <PreviewLink familyId={familyId} href={href} />
    </>
  );
}

function TreePreview({ familyId }: FamilyPreviewProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-neutral-600">
        Trực quan hoá mối quan hệ giữa các thành viên trong dòng họ qua cây gia phả nhiều đời.
      </p>
      <Link href={`/families/${familyId}/tree`}>
        <Button variant="primary" leftIcon={<Trees className="h-4 w-4" />}>
          Mở cây gia phả
        </Button>
      </Link>
    </div>
  );
}

function MembersPreview({ familyId }: FamilyPreviewProps) {
  const { data, isLoading } = useFamilyMembers(familyId);
  const members = (data?.members ?? []).slice(0, 6);
  return (
    <PreviewSection
      isLoading={isLoading}
      isEmpty={members.length === 0}
      emptyTitle="Chưa có thành viên nào"
      emptyDescription="Hãy thêm thành viên đầu tiên cho gia đình."
      familyId={familyId}
      href="/members"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((m) => (
          <Link
            key={m.member.id}
            href={`/members/${m.member.id}`}
            className="flex items-center gap-3 rounded-lg border border-neutral-100 p-3 transition hover:border-primary-200 hover:bg-primary-50/40"
          >
            <Avatar name={m.member.fullName} src={m.member.avatarUrl} size="sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-neutral-900">
                {m.member.fullName}
              </p>
              <p className="truncate text-xs text-neutral-500">
                {m.member.occupation ?? (m.member.birthDate ? formatDate(m.member.birthDate) : '—')}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </PreviewSection>
  );
}

function RecipesPreview({ familyId }: FamilyPreviewProps) {
  const { data, isLoading } = useRecipes(familyId, { size: 6 });
  const recipes = data?.recipes ?? [];
  return (
    <PreviewSection
      isLoading={isLoading}
      isEmpty={recipes.length === 0}
      emptyTitle="Chưa có công thức nào"
      emptyDescription="Thêm công thức nấu ăn để lưu giữ tinh hoa ẩm thực gia đình."
      familyId={familyId}
      href="/recipes"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {recipes.map((r) => (
          <Link
            key={r.recipe.id}
            href={`/recipes/${r.recipe.id}`}
            className="flex items-center gap-3 rounded-lg border border-neutral-100 p-3 transition hover:border-primary-200 hover:bg-primary-50/40"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <ChefHat className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-neutral-900">
                {r.recipe.title}
              </p>
              <p className="truncate text-xs text-neutral-500">
                {r.recipe.cuisineType ?? '—'}
                {r.recipe.prepTimeMinutes ? ` · ${r.recipe.prepTimeMinutes}p` : ''}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </PreviewSection>
  );
}

function StoriesPreview({ familyId }: FamilyPreviewProps) {
  const { data, isLoading } = useStories(familyId, { size: 6 });
  const stories = data?.stories ?? [];
  return (
    <PreviewSection
      isLoading={isLoading}
      isEmpty={stories.length === 0}
      emptyTitle="Chưa có câu chuyện nào"
      emptyDescription="Kể lại những kỷ niệm đáng nhớ của gia đình bạn."
      familyId={familyId}
      href="/stories"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stories.map((s) => {
          const story = 'story' in s ? s.story : s;
          return (
            <Link
              key={story.id}
              href={`/stories/${story.id}`}
              className="flex items-center gap-3 rounded-lg border border-neutral-100 p-3 transition hover:border-primary-200 hover:bg-primary-50/40"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                <Quote className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-neutral-900">
                  {story.title}
                </p>
                <p className="truncate text-xs text-neutral-500">
                  {story.createdAt ? formatDate(story.createdAt) : '—'}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </PreviewSection>
  );
}

function TimeCapsulesPreview({ familyId }: FamilyPreviewProps) {
  const { data, isLoading } = useTimeCapsules(familyId);
  const entries = (data?.capsules ?? []).slice(0, 4);
  return (
    <PreviewSection
      isLoading={isLoading}
      isEmpty={entries.length === 0}
      emptyTitle="Chưa có hộp thời gian nào"
      emptyDescription="Niêm phong lời nhắn cho thế hệ tương lai."
      familyId={familyId}
      href="/time-capsules"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {entries.map((entry) => {
          const c = entry.capsule;
          const isOpened = c.isOpened === true;
          return (
            <Link
              key={c.id}
              href={`/time-capsules?open=${c.id}`}
              className="flex items-center gap-3 rounded-lg border border-neutral-100 p-3 transition hover:border-amber-200 hover:bg-amber-50/40"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                <Clock className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-neutral-900">
                  {c.title}
                </p>
                <p className="truncate text-xs text-neutral-500">
                  {isOpened
                    ? 'Đã mở'
                    : c.unlockDate
                      ? `Mở khoá: ${formatDate(c.unlockDate)}`
                      : entry.isUnlockable
                        ? 'Sẵn sàng mở'
                        : 'Đang niêm phong'}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </PreviewSection>
  );
}

function EventsPreview({ familyId }: FamilyPreviewProps) {
  const { data, isLoading } = useEvents(familyId, { size: 6 });
  const events = (data?.events ?? []).slice(0, 6);
  return (
    <PreviewSection
      isLoading={isLoading}
      isEmpty={events.length === 0}
      emptyTitle="Chưa có sự kiện nào"
      emptyDescription="Tạo sự kiện để mời cả gia đình cùng tham dự."
      familyId={familyId}
      href="/events"
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((entry) => {
          const e = entry.event;
          return (
            <Link
              key={e.id}
              href={`/events/${e.id}`}
              className="flex items-center gap-3 rounded-lg border border-neutral-100 p-3 transition hover:border-primary-200 hover:bg-primary-50/40"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
                <Calendar className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-neutral-900">
                  {e.title}
                </p>
                <p className="truncate text-xs text-neutral-500">
                  {formatDate(e.eventDate ?? e.createdAt)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </PreviewSection>
  );
}

interface OverviewTabProps {
  familyId: string;
  heritages: NonNullable<ReturnType<typeof useFamily>['data']>['heritages'];
  generations: NonNullable<ReturnType<typeof useFamily>['data']>['generations'];
}

function OverviewTab({ heritages, generations }: OverviewTabProps) {
  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-3 text-sm font-semibold text-neutral-700">
          Di sản ({heritages.length})
        </h3>
        {heritages.length === 0 ? (
          <p className="rounded-lg border border-dashed border-neutral-200 px-4 py-6 text-center text-sm text-neutral-500">
            Chưa có di sản nào được ghi nhận.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {heritages.map((h) => (
              <Card key={h.id} padding="md" className="border border-neutral-100">
                <CardContent>
                  <Badge variant="info" size="sm" className="mb-2">
                    {h.heritageType}
                  </Badge>
                  <p className="font-semibold text-neutral-900">{h.title}</p>
                  {h.description && (
                    <p className="mt-1 text-xs text-neutral-500">
                      {h.description}
                    </p>
                  )}
                  {h.yearEstablished && (
                    <p className="mt-2 text-xs text-neutral-400">
                      Năm {h.yearEstablished}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-neutral-700">
          Các đời ({generations.length})
        </h3>
        {generations.length === 0 ? (
          <p className="rounded-lg border border-dashed border-neutral-200 px-4 py-6 text-center text-sm text-neutral-500">
            Các đời sẽ được tự động tạo khi có thành viên.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {generations.map((g) => (
              <Badge key={g.id} variant="primary" size="md">
                Đời {g.generationNumber} {g.name ? `· ${g.name}` : ''}
              </Badge>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

interface StatTileProps {
  icon: React.ReactNode;
  label: string;
  value: number;
}

function StatTile({ icon, label, value }: StatTileProps) {
  return (
    <Card padding="md">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
          {icon}
        </div>
        <div>
          <p className="text-xs text-neutral-500">{label}</p>
          <p className="font-serif text-lg font-semibold text-neutral-900">
            {value}
          </p>
        </div>
      </div>
    </Card>
  );
}

interface EditFamilyModalProps {
  open: boolean;
  onClose: () => void;
  family: NonNullable<ReturnType<typeof useFamily>['data']>['family'];
}

function EditFamilyModal({ open, onClose, family }: EditFamilyModalProps) {
  const updateMutation = useUpdateFamily();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof editSchema>>({
    resolver: zodResolver(editSchema),
    values: {
      name: family.name ?? '',
      description: family.description ?? '',
      foundedYear: family.foundedYear ? String(family.foundedYear) : '',
      motto: family.motto ?? '',
      originLocation: family.originLocation ?? '',
    },
  });

  const onSubmit = async (values: z.infer<typeof editSchema>) => {
    const payload: UpdateFamilyRequest = {
      name: values.name,
      description: values.description || undefined,
      foundedYear: values.foundedYear ? Number(values.foundedYear) : undefined,
      motto: values.motto || undefined,
      originLocation: values.originLocation || undefined,
    };
    try {
      await updateMutation.mutateAsync({ id: family.id, payload });
      showToast.success('Đã cập nhật thông tin gia đình');
      onClose();
    } catch (err) {
      showToast.error(
        err instanceof Error ? err.message : 'Không thể cập nhật'
      );
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Chỉnh sửa thông tin"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Huỷ
          </Button>
          <Button
            form="edit-family-form"
            type="submit"
            variant="primary"
            loading={updateMutation.isPending}
          >
            Lưu
          </Button>
        </>
      }
    >
      <form id="edit-family-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Tên gia đình" error={errors.name?.message} {...register('name')} />
        <Textarea
          label="Mô tả"
          rows={3}
          error={errors.description?.message}
          {...register('description')}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Năm thành lập"
            type="number"
            error={errors.foundedYear?.message}
            {...register('foundedYear')}
          />
          <Input label="Phương ngôn" error={errors.motto?.message} {...register('motto')} />
        </div>
        <Input
          label="Quê quán"
          error={errors.originLocation?.message}
          {...register('originLocation')}
        />
        <button
          type="button"
          onClick={() => reset()}
          className="text-xs text-neutral-500 hover:text-neutral-700"
        >
          Khôi phục mặc định
        </button>
      </form>
    </Modal>
  );
}

interface InviteMemberModalProps {
  open: boolean;
  onClose: () => void;
  familyId: string;
  onSuccess: (invite: { inviteCode: string; inviteUrl: string; expiresAt: string }) => void;
}

function InviteMemberModal({ open, onClose, familyId, onSuccess }: InviteMemberModalProps) {
  const inviteMutation = useCreateInvitation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof inviteSchema>>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { inviteeEmail: '', role: 'EDITOR' },
  });

  const onSubmit = async (values: z.infer<typeof inviteSchema>) => {
    const payload: CreateInvitationRequest = {
      inviteeEmail: values.inviteeEmail,
      role: values.role,
    };
    try {
      const res = await inviteMutation.mutateAsync({ familyId, payload });
      const invite = res?.invitation;
      if (invite?.inviteCode && invite?.inviteUrl) {
        reset();
        onSuccess({
          inviteCode: invite.inviteCode,
          inviteUrl: invite.inviteUrl,
          expiresAt: invite.expiresAt,
        });
      } else {
        showToast.success('Đã tạo lời mời');
        reset();
        onClose();
      }
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : 'Không thể mời');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Mời thành viên"
      description="Gửi mã mời qua email để thêm thành viên vào gia đình."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Huỷ
          </Button>
          <Button
            form="invite-member-form"
            type="submit"
            variant="primary"
            loading={inviteMutation.isPending}
          >
            Tạo lời mời
          </Button>
        </>
      }
    >
      <form id="invite-member-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email người được mời"
          type="email"
          placeholder="nguoimoi@example.com"
          error={errors.inviteeEmail?.message}
          {...register('inviteeEmail')}
        />
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">
            Vai trò
          </label>
          <select
            {...register('role')}
            className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="EDITOR">Biên tập viên (chỉnh sửa)</option>
            <option value="VIEWER">Người xem (chỉ đọc)</option>
            <option value="ADMIN">Quản trị viên</option>
          </select>
        </div>
      </form>
    </Modal>
  );
}

// ---------- Invite success popup (persistent, with QR) ----------
interface InviteSuccessModalProps {
  invite: { inviteCode: string; inviteUrl: string; expiresAt: string } | null;
  onClose: () => void;
  familyName?: string;
  inviterName?: string;
}

function InviteSuccessModal({
  invite,
  onClose,
  familyName,
  inviterName,
}: InviteSuccessModalProps) {
  const [copied, setCopied] = useState<'code' | 'url' | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  if (!invite) return null;

  const expires = new Date(invite.expiresAt);

  const handleCopy = async (text: string, kind: 'code' | 'url') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      setTimeout(() => setCopied((prev) => (prev === kind ? null : prev)), 2000);
    } catch {
      // Fallback: select the text in a hidden input
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(kind);
      setTimeout(() => setCopied((prev) => (prev === kind ? null : prev)), 2000);
    }
  };

  const handleDownloadCard = async () => {
    const node = cardRef.current;
    if (!node) return;
    try {
      await downloadNodeAsPng(node, `thiep-moi-${invite.inviteCode}.png`);
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
    <Modal
      open={true}
      onClose={onClose}
      title="Mã mời đã sẵn sàng"
      description="Gửi mã hoặc quét QR để mời thành viên vào gia đình."
      size="md"
    >
      <div className="space-y-5">
        {/* Self-contained invitation card — what gets exported as a single
            PNG when the user clicks "Tải thiệp mời". */}
        <div
          ref={cardRef}
          className="space-y-4 rounded-2xl border border-neutral-200 p-5 shadow-sm"
          style={{
            background:
              'linear-gradient(135deg, #fffbeb 0%, #ffffff 50%, #fff1f2 100%)',
          }}
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

          <p className="break-all text-center font-mono text-[11px] text-neutral-400">
            {invite.inviteUrl}
          </p>

          <p className="text-center text-xs text-amber-800">
            Hết hạn: {expires.toLocaleString('vi-VN')} · Mã dùng một lần
          </p>
        </div>

        {/* Click-to-copy invite code (n+1 copy affordances for the same
            value so muscle memory works no matter where the user clicks). */}
        <button
          type="button"
          onClick={() => handleCopy(invite.inviteCode, 'code')}
          className="group flex w-full items-center gap-2 rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2.5 text-left transition-colors hover:border-primary-300 hover:bg-primary-50"
          aria-label="Click để sao chép mã mời"
        >
          <span className="flex-1 text-center font-mono text-lg font-semibold tracking-widest text-neutral-900">
            {invite.inviteCode}
          </span>
          <span
            className={`flex items-center gap-1 text-xs font-medium ${
              copied === 'code'
                ? 'text-emerald-600'
                : 'text-neutral-500 group-hover:text-primary-600'
            }`}
          >
            {copied === 'code' ? (
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
            Hoặc chia sẻ đường dẫn
          </label>
          <div className="flex items-center gap-2">
            <div
              className="flex-1 cursor-pointer truncate rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
              onClick={() => handleCopy(invite.inviteUrl, 'url')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCopy(invite.inviteUrl, 'url');
                }
              }}
            >
              {invite.inviteUrl}
            </div>
            <Button
              variant="ghost"
              size="md"
              onClick={() => handleCopy(invite.inviteUrl, 'url')}
              leftIcon={
                copied === 'url' ? (
                  <Check className="h-4 w-4 text-emerald-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )
              }
            >
              {copied === 'url' ? 'Đã sao chép' : 'Sao chép'}
            </Button>
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
