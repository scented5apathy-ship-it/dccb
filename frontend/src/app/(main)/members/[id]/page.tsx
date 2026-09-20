'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  Users,
  Edit,
  MapPin,
  Briefcase,
  Calendar,
  Heart,
  Trash2,
  Trees,
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingState } from '@/components/shared/LoadingState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useMember, useDeleteMember, useUpdateMember } from '@/hooks/useMembers';
import { usePermission } from '@/hooks/usePermission';
import { showToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';
import type { UpdateMemberRequest, Gender } from '@/types/family';

interface PageProps {
  params: { id: string };
}

export default function MemberDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { data, isLoading, isError, error } = useMember(params.id);
  const deleteMutation = useDeleteMember();
  // We need the family scope for the permission hook, but the hook needs
  // to be called before any conditional `return` to keep the rules of
  // hooks. The hook itself is resilient to `undefined` familyId.
  const { isEditor, canEditFamily } = usePermission(data?.member?.familyId);
  const canEditThisMember = isEditor;
  const canDeleteThisMember = canEditFamily;
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) return <LoadingState label="Đang tải hồ sơ thành viên..." />;
  if (isError || !data) {
    return (
      <Card padding="lg">
        <EmptyState
          icon={<Users className="h-10 w-10" />}
          title="Không thể tải thông tin"
          description={
            error instanceof Error ? error.message : 'Vui lòng thử lại sau.'
          }
          action={
            <Button variant="outline" onClick={() => router.back()}>
              Quay lại
            </Button>
          }
        />
      </Card>
    );
  }

  const member = data.member;
  const isAlive = member.isAlive !== false;

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({
        id: member.id,
        familyId: member.familyId,
      });
      showToast.success('Đã xoá thành viên');
      router.push(`/families/${member.familyId}/members`);
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : 'Không thể xoá');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/families/${member.familyId}/members`}
          className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại danh sách
        </Link>
      </div>

      {/* Hero */}
      <Card padding="lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-5">
            <Avatar src={member.avatarUrl} name={member.fullName} size="xl" />
            <div className="min-w-0">
              <h1 className="font-serif text-2xl font-semibold text-neutral-900">
                {member.fullName}
              </h1>
              {member.nickname && (
                <p className="mt-1 text-sm italic text-neutral-500">
                  &ldquo;{member.nickname}&rdquo;
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {typeof member.generationNumber === 'number' && (
                  <Badge variant="primary" size="md">
                    Đời {member.generationNumber}
                  </Badge>
                )}
                {member.gender && (
                  <Badge variant="default" size="md">
                    {member.gender}
                  </Badge>
                )}
                {!isAlive && (
                  <Badge variant="warning" size="md">
                    Đã mất
                  </Badge>
                )}
              </div>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                {member.birthDate && (
                  <div className="flex items-start gap-2">
                    <Calendar className="mt-0.5 h-4 w-4 text-neutral-400" />
                    <div>
                      <dt className="text-xs text-neutral-500">Sinh</dt>
                      <dd className="text-neutral-900">
                        {formatDate(member.birthDate)}
                        {typeof member.age === 'number' && isAlive
                          ? ` (${member.age} tuổi)`
                          : ''}
                      </dd>
                    </div>
                  </div>
                )}
                {!isAlive && member.deathDate && (
                  <div className="flex items-start gap-2">
                    <Calendar className="mt-0.5 h-4 w-4 text-neutral-400" />
                    <div>
                      <dt className="text-xs text-neutral-500">Mất</dt>
                      <dd className="text-neutral-900">
                        {formatDate(member.deathDate)}
                      </dd>
                    </div>
                  </div>
                )}
                {member.birthPlace && (
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 text-neutral-400" />
                    <div>
                      <dt className="text-xs text-neutral-500">Nơi sinh</dt>
                      <dd className="text-neutral-900">{member.birthPlace}</dd>
                    </div>
                  </div>
                )}
                {member.currentLocation && (
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-4 w-4 text-neutral-400" />
                    <div>
                      <dt className="text-xs text-neutral-500">Nơi ở hiện tại</dt>
                      <dd className="text-neutral-900">
                        {member.currentLocation}
                      </dd>
                    </div>
                  </div>
                )}
                {member.occupation && (
                  <div className="flex items-start gap-2">
                    <Briefcase className="mt-0.5 h-4 w-4 text-neutral-400" />
                    <div>
                      <dt className="text-xs text-neutral-500">Nghề nghiệp</dt>
                      <dd className="text-neutral-900">{member.occupation}</dd>
                    </div>
                  </div>
                )}
              </dl>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/families/${member.familyId}/tree`}>
              <Button variant="outline" leftIcon={<Trees className="h-4 w-4" />}>
                Cây gia phả
              </Button>
            </Link>
            {canEditThisMember && (
            <Button
              variant="outline"
              leftIcon={<Edit className="h-4 w-4" />}
              onClick={() => setEditOpen(true)}
            >
              Chỉnh sửa
            </Button>
            )}
            {canDeleteThisMember && (
            <Button
              variant="ghost"
              leftIcon={<Trash2 className="h-4 w-4" />}
              onClick={() => setDeleteOpen(true)}
              className="text-red-600 hover:bg-red-50"
            >
              Xoá
            </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Biography */}
      {member.biography && (
        <Card padding="lg">
          <CardHeader title="Tiểu sử" />
          <CardContent>
            <p className="whitespace-pre-wrap text-sm text-neutral-700">
              {member.biography}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Relationships */}
      <RelationshipsCard data={data} />

      <EditMemberModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        member={member}
      />
      <ConfirmDialog
        open={deleteOpen}
        title="Xoá thành viên"
        description="Hành động này không thể hoàn tác. Bạn có chắc muốn xoá?"
        confirmText="Xoá"
        variant="danger"
        loading={deleteMutation.isPending}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}

interface RelationshipsCardProps {
  data: NonNullable<ReturnType<typeof useMember>['data']>;
}

function RelationshipsCard({ data }: RelationshipsCardProps) {
  const sections: Array<{
    title: string;
    icon: typeof Heart;
    items: Array<{ id: string; name: string; sub?: string }>;
    empty: string;
  }> = [
    {
      title: 'Cha mẹ',
      icon: Users,
      items: (data.parents ?? []).map((p) => ({
        id: p.id,
        name: p.fullName,
        sub: p.birthDate ? formatDate(p.birthDate) : undefined,
      })),
      empty: 'Chưa có thông tin',
    },
    {
      title: 'Con cái',
      icon: Users,
      items: (data.children ?? []).map((c) => ({
        id: c.id,
        name: c.fullName,
        sub: c.birthDate ? formatDate(c.birthDate) : undefined,
      })),
      empty: 'Chưa có thông tin',
    },
    {
      title: 'Vợ/Chồng',
      icon: Heart,
      items: (data.spouses ?? []).map((s) => ({
        id: s.id,
        name: s.fullName,
        sub: s.birthDate ? formatDate(s.birthDate) : undefined,
      })),
      empty: 'Chưa có thông tin',
    },
    {
      title: 'Anh chị em',
      icon: Users,
      items: (data.siblings ?? []).map((s) => ({
        id: s.id,
        name: s.fullName,
        sub: s.birthDate ? formatDate(s.birthDate) : undefined,
      })),
      empty: 'Chưa có thông tin',
    },
  ];

  const hasAny = sections.some((s) => s.items.length > 0);

  return (
    <Card padding="lg">
      <CardHeader title="Quan hệ gia đình" />
      {!hasAny ? (
        <p className="rounded-lg border border-dashed border-neutral-200 px-4 py-6 text-center text-sm text-neutral-500">
          Chưa có quan hệ nào được ghi nhận cho thành viên này.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {sections.map((section) => (
            <div key={section.title}>
              <h4 className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                <section.icon className="h-3.5 w-3.5" />
                {section.title}
              </h4>
              {section.items.length === 0 ? (
                <p className="text-xs text-neutral-400">{section.empty}</p>
              ) : (
                <ul className="space-y-1.5">
                  {section.items.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={`/members/${item.id}`}
                        className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-neutral-50"
                      >
                        <Avatar name={item.name} size="xs" />
                        <span className="font-medium text-neutral-900">
                          {item.name}
                        </span>
                        {item.sub && (
                          <span className="text-xs text-neutral-400">
                            · {item.sub}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

const editSchema = z.object({
  fullName: z.string().min(1, 'Vui lòng nhập họ tên').min(2),
  nickname: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  birthDate: z.string().optional(),
  deathDate: z.string().optional(),
  birthPlace: z.string().optional(),
  currentLocation: z.string().optional(),
  occupation: z.string().optional(),
  biography: z.string().max(2000).optional(),
  isAlive: z.boolean().optional(),
});

interface EditMemberModalProps {
  open: boolean;
  onClose: () => void;
  member: NonNullable<ReturnType<typeof useMember>['data']>['member'];
}

function EditMemberModal({ open, onClose, member }: EditMemberModalProps) {
  const updateMutation = useUpdateMember();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof editSchema>>({
    resolver: zodResolver(editSchema),
    values: {
      fullName: member.fullName,
      nickname: member.nickname ?? '',
      gender: (member.gender as 'MALE' | 'FEMALE' | 'OTHER' | undefined) ?? 'MALE',
      birthDate: member.birthDate ?? '',
      deathDate: member.deathDate ?? '',
      birthPlace: member.birthPlace ?? '',
      currentLocation: member.currentLocation ?? '',
      occupation: member.occupation ?? '',
      biography: member.biography ?? '',
      isAlive: member.isAlive !== false,
    },
  });

  const onSubmit = async (values: z.infer<typeof editSchema>) => {
    const payload: UpdateMemberRequest = {
      fullName: values.fullName.trim(),
      nickname: values.nickname?.trim() || undefined,
      gender: values.gender as Gender | undefined,
      birthDate: values.birthDate || undefined,
      deathDate: values.deathDate || undefined,
      birthPlace: values.birthPlace?.trim() || undefined,
      currentLocation: values.currentLocation?.trim() || undefined,
      occupation: values.occupation?.trim() || undefined,
      biography: values.biography?.trim() || undefined,
      isAlive: values.isAlive ?? true,
    };
    try {
      await updateMutation.mutateAsync({ id: member.id, payload });
      showToast.success('Đã cập nhật thông tin');
      onClose();
    } catch (err) {
      showToast.error(err instanceof Error ? err.message : 'Không thể cập nhật');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Chỉnh sửa thành viên"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Huỷ
          </Button>
          <Button
            form="edit-member-form"
            type="submit"
            variant="primary"
            loading={updateMutation.isPending}
          >
            Lưu
          </Button>
        </>
      }
    >
      <form
        id="edit-member-form"
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
        <Input
          label="Nghề nghiệp"
          error={errors.occupation?.message}
          {...register('occupation')}
        />
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
