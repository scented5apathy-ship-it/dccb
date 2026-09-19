'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Users,
  Search,
  UserPlus,
  Trash2,
  Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingState } from '@/components/shared/LoadingState';
import { Modal } from '@/components/ui/Modal';
import {
  useCreateMember,
  useDeleteMember,
  useUpdateMember,
  useUpdateMemberRole,
} from '@/hooks/useMembers';
import { useFamily, useFamilyMembers } from '@/hooks/useFamily';
import { useGenerations } from '@/hooks/useGenerations';
import { memberApi } from '@/lib/api-client';
import { showToast } from '@/components/ui/Toast';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { formatDate } from '@/lib/utils';
import type {
  CreateMemberRequest,
  FamilyMember,
  Gender,
  MemberWithRelationships,
} from '@/types/family';

interface PageProps {
  params: { id: string };
}

export default function FamilyMembersPage({ params }: PageProps) {
  const router = useRouter();
  const familyId = params.id;
  const [search, setSearch] = useState('');
  const [generationFilter, setGenerationFilter] = useState<string>('');
  const [aliveOnly, setAliveOnly] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editing, setEditing] = useState<FamilyMember | null>(null);

  const filters = useMemo(
    () => ({
      search: search || undefined,
      generationId: generationFilter || undefined,
      aliveOnly: aliveOnly || undefined,
    }),
    [search, generationFilter, aliveOnly]
  );

  const { data, isLoading, isError, error } = useFamilyMembers(familyId, filters);
  const { data: generationsData } = useGenerations(familyId);
  const { data: familyData } = useFamily(familyId);
  const deleteMutation = useDeleteMember();
  const updateMutation = useUpdateMember();
  const updateRoleMutation = useUpdateMemberRole();

  // Only ADMINs can change another member's role. The family creator is
  // always ADMIN (server-enforced); the role check here is just for the UI.
  const currentUserRole = (familyData?.role ?? '').toUpperCase();
  const isCurrentUserAdmin = currentUserRole === 'ADMIN';

  const members = useMemo(() => data?.members ?? [], [data?.members]);

  // Per-member roles, fetched lazily for members that have a linked user.
  // The creator's role is hard-coded to ADMIN (server enforces this).
  const [memberRoles, setMemberRoles] = useState<Record<string, string>>({});

  useEffect(() => {
    // Fetch each member's role in parallel. Small families (<= a few dozen
    // members) make this cheap; if it ever grows we can switch to a single
    // batch endpoint.
    const fid = familyData?.family.id;
    if (!fid || !isCurrentUserAdmin) return;
    let cancelled = false;
    const linked = members.filter((m) => Boolean(m.member.userId));
    Promise.all(
      linked.map(async (m) => {
        try {
          const { role } = await memberApi.getRole(fid, m.member.id);
          return [m.member.id, role ?? 'MEMBER'] as const;
        } catch {
          return [m.member.id, 'MEMBER'] as const;
        }
      })
    ).then((entries) => {
      if (cancelled) return;
      setMemberRoles(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
  }, [members, familyData?.family.id, isCurrentUserAdmin]);

  const handleChangeRole = async (
    memberId: string,
    newRole: string
  ): Promise<void> => {
    if (!['ADMIN', 'EDITOR', 'VIEWER'].includes(newRole)) return;
    try {
      await updateRoleMutation.mutateAsync({
        familyId,
        memberId,
        role: newRole as 'ADMIN' | 'EDITOR' | 'VIEWER',
      });
      setMemberRoles((prev) => ({ ...prev, [memberId]: newRole }));
      showToast.success('Đã cập nhật vai trò');
    } catch (err) {
      showToast.error(
        err instanceof Error ? err.message : 'Không thể cập nhật vai trò'
      );
    }
  };

  const grouped = useMemo(() => {
    const map = new Map<string, MemberWithRelationships[]>();
    members.forEach((m) => {
      const key = String(
        m.generation?.generationNumber ??
          m.member.generationNumber ??
          'unknown'
      );
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    });
    return Array.from(map.entries()).sort(([a], [b]) => {
      const an = Number(a);
      const bn = Number(b);
      if (Number.isNaN(an)) return 1;
      if (Number.isNaN(bn)) return -1;
      return an - bn;
    });
  }, [members]);

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteMutation.mutateAsync({ id: deleteId, familyId });
      showToast.success('Đã xoá thành viên');
      setDeleteId(null);
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : 'Không thể xoá');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href={`/families/${familyId}`}
            className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700"
          >
            <ArrowLeft className="h-4 w-4" /> Quay lại gia đình
          </Link>
          <h1 className="mt-2 font-serif text-2xl font-semibold text-neutral-900">
            Thành viên
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Quản lý thông tin các thành viên trong gia đình.
          </p>
        </div>
        <Button
          variant="primary"
          leftIcon={<UserPlus className="h-4 w-4" />}
          onClick={() => setAddOpen(true)}
        >
          Thêm thành viên
        </Button>
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              type="search"
              placeholder="Tìm kiếm theo tên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 bg-white py-2 pl-10 pr-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={generationFilter}
            onChange={(e) => setGenerationFilter(e.target.value)}
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Tất cả các đời</option>
            {(generationsData?.generations ?? []).map((g) => (
              <option key={g.id} value={g.id}>
                Đời {g.generationNumber}
                {g.name ? ` · ${g.name}` : ''}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-neutral-600">
            <input
              type="checkbox"
              checked={aliveOnly}
              onChange={(e) => setAliveOnly(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
            Chỉ người còn sống
          </label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch('');
              setGenerationFilter('');
              setAliveOnly(false);
            }}
          >
            Xoá bộ lọc
          </Button>
        </div>
      </Card>

      {isLoading ? (
        <LoadingState label="Đang tải danh sách thành viên..." />
      ) : isError ? (
        <Card padding="lg">
          <EmptyState
            icon={<Users className="h-10 w-10" />}
            title="Không thể tải thành viên"
            description={
              error instanceof Error ? error.message : 'Vui lòng thử lại sau.'
            }
            action={
              <Button variant="outline" onClick={() => router.refresh()}>
                Thử lại
              </Button>
            }
          />
        </Card>
      ) : members.length === 0 ? (
        <Card padding="lg">
          <EmptyState
            icon={<Users className="h-10 w-10" />}
            title="Chưa có thành viên nào"
            description="Hãy thêm thành viên đầu tiên cho gia đình bạn."
            action={
              <Button
                variant="primary"
                leftIcon={<UserPlus className="h-4 w-4" />}
                onClick={() => setAddOpen(true)}
              >
                Thêm thành viên
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {grouped.map(([generationKey, list]) => (
            <section key={generationKey}>
              <div className="mb-3 flex items-center gap-2">
                <Badge variant="primary" size="md">
                  {Number.isNaN(Number(generationKey))
                    ? 'Không xác định'
                    : `Đời ${generationKey}`}
                </Badge>
                <span className="text-xs text-neutral-500">
                  {list.length} thành viên
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((m) => {
                  const isMemberCreator =
                    Boolean(m.member.userId) &&
                    m.member.userId === familyData?.family.createdBy;
                  return (
                    <MemberItem
                      key={m.member.id}
                      member={m.member}
                      currentRole={
                        isMemberCreator
                          ? 'ADMIN'
                          : (memberRoles[m.member.id] ?? null)
                      }
                      canEditRole={isCurrentUserAdmin && Boolean(m.member.userId)}
                      isCreator={isMemberCreator}
                      isUpdatingRole={
                        updateRoleMutation.isPending &&
                        updateRoleMutation.variables?.memberId === m.member.id
                      }
                      onEdit={() => setEditing(m.member)}
                      onDelete={() => setDeleteId(m.member.id)}
                      onChangeRole={(newRole) =>
                        void handleChangeRole(m.member.id, newRole)
                      }
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      <AddMemberModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        familyId={familyId}
        generations={generationsData?.generations ?? []}
      />

      <EditMemberModal
        open={editing !== null}
        member={editing}
        generations={generationsData?.generations ?? []}
        onClose={() => setEditing(null)}
        onSubmit={async (payload) => {
          if (!editing) return;
          try {
            await updateMutation.mutateAsync({ id: editing.id, payload });
            showToast.success('Đã cập nhật thành viên');
            setEditing(null);
          } catch (err) {
            showToast.error(
              err instanceof Error ? err.message : 'Không thể cập nhật'
            );
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Xoá thành viên"
        description="Hành động này không thể hoàn tác. Thành viên sẽ bị xoá khỏi gia đình."
        confirmText="Xoá"
        variant="danger"
        loading={deleteMutation.isPending}
        onCancel={() => setDeleteId(null)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}

interface MemberItemProps {
  member: FamilyMember;
  currentRole?: string | null;
  canEditRole: boolean;
  isCreator: boolean;
  isUpdatingRole: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onChangeRole: (newRole: string) => void;
}

function MemberItem({
  member: m,
  currentRole,
  canEditRole,
  isCreator,
  onEdit,
  onDelete,
  onChangeRole,
  isUpdatingRole,
}: MemberItemProps) {
  const roleLabel: Record<string, string> = {
    ADMIN: 'Quản trị viên',
    EDITOR: 'Biên tập viên',
    VIEWER: 'Người xem',
    MEMBER: 'Thành viên',
  };
  const roleTone =
    currentRole === 'ADMIN'
      ? 'success'
      : currentRole === 'EDITOR'
        ? 'primary'
        : 'default';
  return (
    <Card padding="md" className="border border-neutral-100">
      <div className="flex items-start gap-3">
        <Link href={`/members/${m.id}`} className="shrink-0">
          <Avatar src={m.avatarUrl} name={m.fullName} size="md" />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={`/members/${m.id}`}
            className="block truncate text-sm font-semibold text-neutral-900 hover:text-primary-700"
          >
            {m.fullName}
          </Link>
          <p className="truncate text-xs text-neutral-500">
            {m.birthDate ? formatDate(m.birthDate) : m.occupation ?? '—'}
            {m.birthPlace ? ` · ${m.birthPlace}` : ''}
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            {typeof m.generationNumber === 'number' && (
              <Badge variant="primary" size="sm">
                Đời {m.generationNumber}
              </Badge>
            )}
            {m.isAlive === false && (
              <Badge variant="default" size="sm">
                Đã mất
              </Badge>
            )}
            {m.gender && (
              <Badge variant="default" size="sm">
                {m.gender}
              </Badge>
            )}
            {currentRole && (
              <Badge variant={roleTone as never} size="sm">
                {roleLabel[currentRole] ?? currentRole}
              </Badge>
            )}
          </div>
          {canEditRole && (
            <div className="mt-2 flex items-center gap-2">
              <label className="text-xs text-neutral-500">Vai trò:</label>
              <select
                value={currentRole ?? ''}
                disabled={isCreator || isUpdatingRole}
                onChange={(e) => onChangeRole(e.target.value)}
                className="rounded border border-neutral-300 bg-white px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-60"
                aria-label={`Đổi vai trò cho ${m.fullName}`}
              >
                {!currentRole && (
                  <option value="" disabled>
                    — chọn —
                  </option>
                )}
                <option value="ADMIN">Quản trị viên</option>
                <option value="EDITOR">Biên tập viên</option>
                <option value="VIEWER">Người xem</option>
              </select>
              {isCreator && (
                <span className="text-[10px] text-neutral-400">
                  Không thể đổi vai trò của người tạo
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-col gap-1">
          <button
            type="button"
            onClick={onEdit}
            className="rounded p-1.5 text-neutral-300 hover:bg-amber-50 hover:text-amber-600"
            aria-label="Sửa thành viên"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded p-1.5 text-neutral-300 hover:bg-red-50 hover:text-red-600"
            aria-label="Xoá thành viên"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
    </Card>
  );
}

interface AddMemberModalProps {
  open: boolean;
  onClose: () => void;
  familyId: string;
  generations: Array<{ id: string; generationNumber: number; name?: string }>;
}

const createMemberSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Vui lòng nhập họ tên')
    .min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  nickname: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  birthDate: z.string().optional(),
  deathDate: z.string().optional(),
  birthPlace: z.string().optional(),
  currentLocation: z.string().optional(),
  occupation: z.string().optional(),
  biography: z.string().max(2000).optional(),
  generationId: z.string().optional(),
  isAlive: z.boolean().optional(),
});

function AddMemberModal({
  open,
  onClose,
  familyId,
  generations,
}: AddMemberModalProps) {
  const createMutation = useCreateMember();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof createMemberSchema>>({
    resolver: zodResolver(createMemberSchema),
    defaultValues: {
      fullName: '',
      nickname: '',
      gender: 'MALE',
      birthDate: '',
      deathDate: '',
      birthPlace: '',
      currentLocation: '',
      occupation: '',
      biography: '',
      isAlive: true,
    },
  });

  const onSubmit = async (values: z.infer<typeof createMemberSchema>) => {
    const payload: CreateMemberRequest = {
      fullName: values.fullName.trim(),
      nickname: values.nickname?.trim() || undefined,
      gender: (values.gender as Gender) ?? undefined,
      birthDate: values.birthDate || undefined,
      deathDate: values.deathDate || undefined,
      birthPlace: values.birthPlace?.trim() || undefined,
      currentLocation: values.currentLocation?.trim() || undefined,
      occupation: values.occupation?.trim() || undefined,
      biography: values.biography?.trim() || undefined,
      generationId: values.generationId || undefined,
      isAlive: values.isAlive ?? true,
    };
    try {
      await createMutation.mutateAsync({ familyId, payload });
      showToast.success('Đã thêm thành viên mới');
      reset();
      onClose();
    } catch (err) {
      showToast.error(
        err instanceof Error ? err.message : 'Không thể thêm thành viên'
      );
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Thêm thành viên mới"
      description="Điền các thông tin cơ bản. Bạn có thể bổ sung chi tiết sau."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Huỷ
          </Button>
          <Button
            form="add-member-form"
            type="submit"
            variant="primary"
            loading={createMutation.isPending}
          >
            Thêm
          </Button>
        </>
      }
    >
      <form
        id="add-member-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Họ và tên *"
            error={errors.fullName?.message}
            {...register('fullName')}
          />
          <Input
            label="Biệt danh"
            error={errors.nickname?.message}
            {...register('nickname')}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              Giới tính
            </label>
            <select
              {...register('gender')}
              className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="MALE">Nam</option>
              <option value="FEMALE">Nữ</option>
              <option value="OTHER">Khác</option>
            </select>
          </div>
          <Input
            label="Ngày sinh"
            type="date"
            error={errors.birthDate?.message}
            {...register('birthDate')}
          />
          <Input
            label="Ngày mất"
            type="date"
            error={errors.deathDate?.message}
            {...register('deathDate')}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Nơi sinh"
            error={errors.birthPlace?.message}
            {...register('birthPlace')}
          />
          <Input
            label="Nơi ở hiện tại"
            error={errors.currentLocation?.message}
            {...register('currentLocation')}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Nghề nghiệp"
            error={errors.occupation?.message}
            {...register('occupation')}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              Đời
            </label>
            <select
              {...register('generationId')}
              className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">-- Chọn đời --</option>
              {generations.map((g) => (
                <option key={g.id} value={g.id}>
                  Đời {g.generationNumber}
                  {g.name ? ` · ${g.name}` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
        <Textarea
          label="Tiểu sử"
          rows={3}
          error={errors.biography?.message}
          {...register('biography')}
        />
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            {...register('isAlive')}
            className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
          />
          Còn sống
        </label>
      </form>
    </Modal>
  );
}

// ---------- Edit member modal ----------
interface EditMemberModalProps {
  open: boolean;
  member: FamilyMember | null;
  generations: Array<{ id: string; generationNumber: number; name?: string }>;
  onClose: () => void;
  onSubmit: (payload: Partial<CreateMemberRequest>) => Promise<void>;
}

const editSchema = z.object({
  fullName: z.string().min(1, 'Họ tên không được trống'),
  nickname: z.string().max(100).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  birthDate: z.string().optional(),
  deathDate: z.string().optional(),
  birthPlace: z.string().max(200).optional(),
  currentLocation: z.string().max(200).optional(),
  occupation: z.string().max(200).optional(),
  biography: z.string().max(2000).optional(),
  generationId: z.string().optional(),
  isAlive: z.boolean().optional(),
});

function EditMemberModal({
  open,
  member,
  generations,
  onClose,
  onSubmit,
}: EditMemberModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof editSchema>>({
    resolver: zodResolver(editSchema),
    values: member
      ? {
          fullName: member.fullName ?? '',
          nickname: member.nickname ?? '',
          gender: (member.gender as 'MALE' | 'FEMALE' | 'OTHER') ?? undefined,
          birthDate: member.birthDate ?? '',
          deathDate: member.deathDate ?? '',
          birthPlace: member.birthPlace ?? '',
          currentLocation: member.currentLocation ?? '',
          occupation: member.occupation ?? '',
          biography: member.biography ?? '',
          generationId: member.generationId ?? '',
          isAlive: member.isAlive ?? true,
        }
      : undefined,
  });

  const submit = handleSubmit(async (values) => {
    // Cast Gender (which may include lowercase variants) to the form's strict
    // 'MALE'|'FEMALE'|'OTHER' union before persisting.
    const genderValue = (values.gender ?? '') as Gender | '';
    const payload: Partial<CreateMemberRequest> = {
      fullName: values.fullName.trim(),
      nickname: values.nickname?.trim() || undefined,
      gender: genderValue === '' ? undefined : (genderValue as Gender),
      birthDate: values.birthDate || undefined,
      deathDate: values.deathDate || undefined,
      birthPlace: values.birthPlace?.trim() || undefined,
      currentLocation: values.currentLocation?.trim() || undefined,
      occupation: values.occupation?.trim() || undefined,
      biography: values.biography?.trim() || undefined,
      generationId: values.generationId || undefined,
      isAlive: values.isAlive ?? true,
    };
    await onSubmit(payload);
    reset({
      fullName: payload.fullName ?? '',
      nickname: payload.nickname ?? '',
      gender: (payload.gender ?? undefined) as 'MALE' | 'FEMALE' | 'OTHER' | undefined,
      birthDate: payload.birthDate ?? '',
      deathDate: payload.deathDate ?? '',
      birthPlace: payload.birthPlace ?? '',
      currentLocation: payload.currentLocation ?? '',
      occupation: payload.occupation ?? '',
      biography: payload.biography ?? '',
      generationId: payload.generationId ?? '',
      isAlive: payload.isAlive ?? true,
    });
  });

  if (!member) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Sửa: ${member.fullName}`}
      description="Cập nhật thông tin và thế hệ của thành viên."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Huỷ
          </Button>
          <Button form="edit-member-form" type="submit" variant="primary">
            Lưu thay đổi
          </Button>
        </>
      }
    >
      <form id="edit-member-form" onSubmit={submit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Họ và tên"
            error={errors.fullName?.message}
            {...register('fullName')}
          />
          <Input
            label="Biệt danh"
            placeholder="VD: Bà Năm, Cụ Tổ..."
            {...register('nickname')}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              Giới tính
            </label>
            <select
              {...register('gender')}
              defaultValue=""
              className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">-- Chọn --</option>
              <option value="MALE">Nam</option>
              <option value="FEMALE">Nữ</option>
              <option value="OTHER">Khác</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              Đời
            </label>
            <select
              {...register('generationId')}
              defaultValue=""
              className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">-- Chọn đời --</option>
              {generations.map((g) => (
                <option key={g.id} value={g.id}>
                  Đời {g.generationNumber}
                  {g.name ? ` · ${g.name}` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Ngày sinh"
            type="date"
            {...register('birthDate')}
          />
          <Input
            label="Ngày mất"
            type="date"
            {...register('deathDate')}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input
            label="Nơi sinh"
            placeholder="VD: Hà Nội"
            {...register('birthPlace')}
          />
          <Input
            label="Nơi ở hiện tại"
            placeholder="VD: TP. Hồ Chí Minh"
            {...register('currentLocation')}
          />
        </div>
        <Input
          label="Nghề nghiệp"
          placeholder="VD: Giáo viên"
          {...register('occupation')}
        />
        <Textarea
          label="Tiểu sử"
          rows={3}
          {...register('biography')}
        />
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input
            type="checkbox"
            {...register('isAlive')}
            className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
          />
          Còn sống
        </label>
      </form>
    </Modal>
  );
}
