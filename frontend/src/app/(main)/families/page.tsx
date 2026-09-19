'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, KeyRound, Users, Trees } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingState } from '@/components/shared/LoadingState';
import { FamilyCard } from '@/components/family/FamilyCard';
import { showToast } from '@/components/ui/Toast';
import { useFamilies, useJoinFamily } from '@/hooks/useFamily';

const joinSchema = z.object({
  inviteCode: z
    .string()
    .min(1, 'Vui lòng nhập mã mời')
    .min(4, 'Mã mời không hợp lệ'),
});

type JoinValues = z.infer<typeof joinSchema>;

export default function FamiliesPage() {
  const router = useRouter();
  const { data: families, isLoading, isError, error, refetch } = useFamilies();
  const [joinOpen, setJoinOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-neutral-900">
            Gia đình của tôi
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Các gia đình bạn đang tham gia hoặc quản lý.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            leftIcon={<KeyRound className="h-4 w-4" />}
            onClick={() => setJoinOpen(true)}
          >
            Tham gia bằng mã
          </Button>
          <Link href="/families/new">
            <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
              Tạo gia đình
            </Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <LoadingState label="Đang tải danh sách gia đình..." />
      ) : isError ? (
        <div className="rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
          Không thể tải danh sách gia đình:{' '}
          {error instanceof Error ? error.message : 'Lỗi không xác định'}.
          <Button
            size="sm"
            variant="outline"
            className="ml-3"
            onClick={() => refetch()}
          >
            Thử lại
          </Button>
        </div>
      ) : !families || families.length === 0 ? (
        <EmptyState
          icon={<Users className="h-10 w-10" />}
          title="Bạn chưa tham gia gia đình nào"
          description="Hãy tạo gia đình mới hoặc tham gia bằng mã mời."
          action={
            <div className="flex gap-2">
              <Button
                variant="outline"
                leftIcon={<KeyRound className="h-4 w-4" />}
                onClick={() => setJoinOpen(true)}
              >
                Tham gia bằng mã
              </Button>
              <Link href="/families/new">
                <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
                  Tạo gia đình
                </Button>
              </Link>
            </div>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {families.map((f) => (
            <FamilyCard key={f.family.id} family={f.family} />
          ))}
        </div>
      )}

      <JoinFamilyModal
        open={joinOpen}
        onClose={() => setJoinOpen(false)}
        onSuccess={(familyId) => {
          setJoinOpen(false);
          showToast.success('Đã tham gia gia đình thành công');
          router.push(`/families/${familyId}`);
        }}
      />
    </div>
  );
}

interface JoinFamilyModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (familyId: string) => void;
}

function JoinFamilyModal({ open, onClose, onSuccess }: JoinFamilyModalProps) {
  const joinMutation = useJoinFamily();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<JoinValues>({
    resolver: zodResolver(joinSchema),
    defaultValues: { inviteCode: '' },
  });

  const onSubmit = async (values: JoinValues) => {
    try {
      const result = await joinMutation.mutateAsync({
        inviteCode: values.inviteCode.trim(),
      });
      reset();
      if (result?.family?.id) onSuccess(result.family.id);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Mã mời không hợp lệ';
      showToast.error(message);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tham gia gia đình"
      description="Nhập mã mời mà người quản trị viên đã chia sẻ với bạn."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Huỷ
          </Button>
          <Button
            form="join-family-form"
            type="submit"
            variant="primary"
            loading={joinMutation.isPending}
          >
            Tham gia
          </Button>
        </>
      }
    >
      <form id="join-family-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Mã mời"
          placeholder="VD: FAM-ABC123"
          autoComplete="off"
          leftIcon={<KeyRound className="h-4 w-4" />}
          error={errors.inviteCode?.message}
          {...register('inviteCode')}
        />
      </form>
    </Modal>
  );
}
