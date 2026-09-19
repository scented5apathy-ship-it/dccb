'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import {
  Edit,
  Mail,
  Phone,
  Calendar,
  Users,
  UtensilsCrossed,
  BookOpen,
  Clock,
  Trees,
  ArrowRight,
  ChefHat,
  Quote,
} from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input, Textarea } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { showToast } from '@/components/ui/Toast';
import { useAuth } from '@/hooks/useAuth';
import { useFamilies } from '@/hooks/useFamily';
import { userApi, familyApi } from '@/lib/api-client';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import type { UpdateProfileRequest } from '@/types/user';
import type { FamilyDetail, FamilyWithRole } from '@/types/family';

interface FormValues {
  fullName: string;
  phone: string;
  bio: string;
  avatarUrl: string;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateProfileRequest) => userApi.updateMe(payload),
    onSuccess: () => {
      showToast.success('Đã cập nhật hồ sơ');
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      setEditOpen(false);
    },
    onError: (err: Error) => {
      showToast.error('Cập nhật thất bại', { description: err.message });
    },
  });

  const { register, handleSubmit, reset, watch } = useForm<FormValues>({
    defaultValues: {
      fullName: user?.fullName ?? '',
      phone: user?.phone ?? user?.phoneNumber ?? '',
      bio: user?.bio ?? '',
      avatarUrl: user?.avatarUrl ?? '',
    },
    values: {
      fullName: user?.fullName ?? '',
      phone: user?.phone ?? user?.phoneNumber ?? '',
      bio: user?.bio ?? '',
      avatarUrl: user?.avatarUrl ?? '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const payload: UpdateProfileRequest = {
      fullName: values.fullName.trim() || undefined,
      phone: values.phone.trim() || undefined,
      bio: values.bio.trim() || undefined,
      avatarUrl: values.avatarUrl.trim() || undefined,
    };
    await updateMutation.mutateAsync(payload);
    reset(payload);
  });

  const preview = watch();

  // ---- Pull real counts from APIs ----
  const { data: familiesRaw, isLoading: familiesLoading } = useFamilies();
  // Defensive: ensure families is always an array even if the API returns an envelope
  const families: FamilyWithRole[] = Array.isArray(familiesRaw) ? familiesRaw : [];

  // Aggregate per-family recipe/story counts by fetching detail for each family.
  // Disabled until we have at least one family to keep network traffic low.
  const familyIds = families.map((f) => f?.family?.id).filter((id): id is string => Boolean(id));
  const familyDetails = useQuery<FamilyDetail[]>({
    queryKey: ['profile', 'family-details', familyIds],
    queryFn: async () => {
      const results = await Promise.all(
        familyIds.map((id) =>
          familyApi
            .get(id)
            .then((d) => d)
            .catch(() => null)
        )
      );
      return results.filter((d): d is FamilyDetail => d !== null);
    },
    enabled: familyIds.length > 0,
    staleTime: 60_000,
  });

  const recipeCount =
    familyDetails.data?.reduce((sum, d) => sum + (d.stats?.recipeCount ?? 0), 0) ??
    null;
  const storyCount =
    familyDetails.data?.reduce((sum, d) => sum + (d.stats?.storyCount ?? 0), 0) ??
    null;
  const eventCount =
    familyDetails.data?.reduce((sum, d) => sum + (d.stats?.eventCount ?? 0), 0) ??
    null;

  if (!user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Spinner size="lg" label="Đang tải hồ sơ..." />
      </div>
    );
  }

  const familyCount = families.length;
  const totalMembers =
    families.reduce((sum, f) => sum + (f.memberCount ?? 0), 0);

  const stats: Array<{
    icon: typeof Users;
    label: string;
    value: string;
    href: string;
    hue: 'primary' | 'success' | 'info' | 'warning';
    loading?: boolean;
  }> = [
    {
      icon: Users,
      label: 'Gia đình đã tham gia',
      value: familiesLoading ? '—' : familyCount.toString(),
      href: '/families',
      hue: 'primary',
    },
    {
      icon: UtensilsCrossed,
      label: 'Công thức',
      value:
        familyDetails.isLoading
          ? '—'
          : (recipeCount ?? 0).toString(),
      href: '/recipes',
      hue: 'success',
      loading: familyDetails.isLoading,
    },
    {
      icon: BookOpen,
      label: 'Câu chuyện',
      value:
        familyDetails.isLoading
          ? '—'
          : (storyCount ?? 0).toString(),
      href: '/stories',
      hue: 'info',
      loading: familyDetails.isLoading,
    },
    {
      icon: Clock,
      label: 'Sự kiện đã tạo',
      value:
        familyDetails.isLoading
          ? '—'
          : (eventCount ?? 0).toString(),
      href: '/events',
      hue: 'warning',
      loading: familyDetails.isLoading,
    },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Card padding="none" className="overflow-hidden">
        <div className="aspect-[5/1] w-full bg-gradient-to-r from-primary-200 via-accent-100 to-primary-50" />
        <div className="space-y-4 px-6 pb-6">
          <div className="-mt-12 flex flex-wrap items-end justify-between gap-3">
            <div className="flex items-end gap-4">
              <Avatar
                size="xl"
                name={user.fullName}
                src={user.avatarUrl}
                className="ring-4 ring-white"
              />
              <div className="pb-1">
                <h1 className="font-serif text-2xl font-semibold text-neutral-900">
                  {user.fullName || 'Chưa có tên'}
                </h1>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-500">
                  <span className="inline-flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" />
                    {user.email}
                  </span>
                  {(user.phone || user.phoneNumber) && (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {user.phone ?? user.phoneNumber}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Tham gia {formatDate(user.createdAt)}
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              leftIcon={<Edit className="h-4 w-4" />}
              onClick={() => setEditOpen(true)}
            >
              Chỉnh sửa hồ sơ
            </Button>
          </div>

          {user.bio && (
            <p className="border-t border-neutral-100 pt-4 text-neutral-700">
              {user.bio}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {user.role && (
              <Badge variant="primary">
                Vai trò: {String(user.role).toLowerCase()}
              </Badge>
            )}
            {user.emailVerified && <Badge variant="success">Email đã xác thực</Badge>}
            <Badge variant="default">
              Hoạt động {formatRelativeTime(user.lastLoginAt)}
            </Badge>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const hueMap: Record<string, string> = {
            primary: 'bg-primary-100 text-primary-700',
            success: 'bg-emerald-100 text-emerald-700',
            info: 'bg-sky-100 text-sky-700',
            warning: 'bg-amber-100 text-amber-700',
          };
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="block transition-transform hover:-translate-y-0.5"
            >
              <Card padding="md" className="text-center">
                <div
                  className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full ${hueMap[stat.hue]}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-xl font-semibold text-neutral-900">
                  {stat.value}
                </p>
                <p className="text-xs text-neutral-500">{stat.label}</p>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Recent families (real data) */}
      <Card padding="lg">
        <CardHeader
          title="Gia đình của bạn"
          description={
            familyCount > 0
              ? `Bạn đang tham gia ${familyCount} gia đình với tổng cộng ${totalMembers} thành viên.`
              : 'Bạn chưa tham gia gia đình nào.'
          }
          action={
            familyCount > 0 ? (
              <Link href="/families">
                <Button
                  variant="ghost"
                  size="sm"
                  rightIcon={<ArrowRight className="h-3.5 w-3.5" />}
                >
                  Tất cả
                </Button>
              </Link>
            ) : null
          }
        />
        {familiesLoading ? (
          <div className="flex justify-center py-6">
            <Spinner size="md" label="Đang tải..." />
          </div>
        ) : familyCount === 0 ? (
          <div className="pt-2">
            <EmptyState
              icon={<Trees className="h-10 w-10" />}
              title="Chưa tham gia gia đình nào"
              description="Tạo hoặc tham gia một gia đình để bắt đầu xây dựng cây gia phả."
              action={
                <Link href="/families/new">
                  <Button variant="primary" leftIcon={<Trees className="h-4 w-4" />}>
                    Tạo gia đình
                  </Button>
                </Link>
              }
            />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {families.slice(0, 6).map((f) => (
              <Link
                key={f.family.id}
                href={`/families/${f.family.id}`}
                className="flex items-center gap-3 rounded-lg border border-neutral-100 p-3 transition-all hover:border-primary-200 hover:bg-primary-50/40"
              >
                <Avatar name={f.family.name} size="md" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-neutral-900">
                    {f.family.name}
                  </p>
                  <p className="truncate text-xs text-neutral-500">
                    {f.memberCount ?? 0} thành viên · {f.role}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Quick actions */}
      <Card padding="lg">
        <CardHeader title="Thao tác nhanh" />
        <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/recipes/new" className="block">
            <Button variant="outline" leftIcon={<ChefHat className="h-4 w-4" />} fullWidth>
              Thêm công thức
            </Button>
          </Link>
          <Link href="/stories/new" className="block">
            <Button variant="outline" leftIcon={<Quote className="h-4 w-4" />} fullWidth>
              Viết câu chuyện
            </Button>
          </Link>
          <Link href="/time-capsules" className="block">
            <Button variant="ghost" leftIcon={<Clock className="h-4 w-4" />} fullWidth>
              Hộp thời gian
            </Button>
          </Link>
          <Link href="/events" className="block">
            <Button variant="ghost" leftIcon={<Calendar className="h-4 w-4" />} fullWidth>
              Sự kiện
            </Button>
          </Link>
        </CardContent>
      </Card>

      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Chỉnh sửa hồ sơ"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Huỷ
            </Button>
            <Button onClick={onSubmit} loading={updateMutation.isPending}>
              Lưu thay đổi
            </Button>
          </>
        }
      >
        <form className="space-y-4" onSubmit={onSubmit} noValidate>
          <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
            <Avatar
              size="md"
              name={preview.fullName || 'Avatar'}
              src={preview.avatarUrl}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-neutral-900">
                {preview.fullName || 'Tên của bạn'}
              </p>
              <p className="text-xs text-neutral-500">{user.email}</p>
            </div>
          </div>
          <Input
            label="Họ và tên"
            {...register('fullName', { required: 'Vui lòng nhập họ tên' })}
          />
          <Input
            label="Số điện thoại"
            placeholder="VD: 0901234567"
            {...register('phone')}
          />
          <Input
            label="URL ảnh đại diện"
            placeholder="https://..."
            {...register('avatarUrl')}
          />
          <Textarea
            label="Tiểu sử"
            placeholder="Một vài dòng giới thiệu về bạn..."
            rows={3}
            {...register('bio')}
          />
        </form>
      </Modal>
    </div>
  );
}
