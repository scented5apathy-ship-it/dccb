'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Lock, Calendar, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { showToast } from '@/components/ui/Toast';
import { useCreateTimeCapsule } from '@/hooks/useTimeCapsules';
import type { CreateTimeCapsuleRequest } from '@/types/time-capsule';
import { cn } from '@/lib/utils';

type Condition = 'DATE' | 'EVENT' | 'MANUAL';

export interface CreateTimeCapsuleFormProps {
  familyId: string;
  /** Optional callback fired after a successful submission. */
  onSuccess?: (capsuleId?: string) => void;
  /** List of recipient options (members that can receive the capsule). */
  recipients?: Array<{ id: string; fullName: string }>;
}

interface FormValues {
  title: string;
  content: string;
  mediaUrl: string;
  recipientMemberId: string;
  unlockDate: string;
  unlockCondition: Condition;
  unlockEvent: string;
}

/**
 * Compose and seal a new time capsule. The form validates that the unlock
 * date is in the future, lets the user pick between date / event / manual
 * unlock conditions, and shows a preview of the capsule before submit.
 */
export function CreateTimeCapsuleForm({
  familyId,
  onSuccess,
  recipients = [],
}: CreateTimeCapsuleFormProps) {
  const createMutation = useCreateTimeCapsule();
  const [preview, setPreview] = useState<FormValues | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      title: '',
      content: '',
      mediaUrl: '',
      recipientMemberId: '',
      unlockDate: '',
      unlockCondition: 'DATE',
      unlockEvent: '',
    },
  });

  const watched = watch();

  const onSubmit = handleSubmit(async (values) => {
    if (!values.unlockDate) {
      showToast.error('Vui lòng chọn ngày mở');
      return;
    }
    const unlock = new Date(values.unlockDate);
    if (unlock.getTime() <= Date.now()) {
      showToast.error('Ngày mở phải ở tương lai');
      return;
    }

    setPreview(values);

    const payload: CreateTimeCapsuleRequest = {
      familyId,
      title: values.title.trim(),
      content: values.content.trim() || undefined,
      mediaUrl: values.mediaUrl.trim() || undefined,
      recipientMemberId: values.recipientMemberId || undefined,
      unlockDate: values.unlockDate,
      unlockCondition: values.unlockCondition,
      unlockEvent: values.unlockEvent.trim() || undefined,
    };

    try {
      const result = await createMutation.mutateAsync(payload);
      showToast.success('Đã niêm phong hộp thời gian!');
      onSuccess?.(result?.capsule?.id);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Không thể tạo hộp thời gian';
      showToast.error('Tạo thất bại', { description: message });
    }
  });

  return (
    <form className="space-y-5" onSubmit={onSubmit} noValidate>
      <Input
        label="Tiêu đề"
        placeholder="Ví dụ: Thư gửi con trai năm 18 tuổi"
        error={errors.title?.message}
        {...register('title', {
          required: 'Vui lòng nhập tiêu đề',
          maxLength: { value: 200, message: 'Tối đa 200 ký tự' },
        })}
      />

      <Textarea
        label="Nội dung thư"
        placeholder="Viết điều bạn muốn gửi gắm..."
        rows={6}
        error={errors.content?.message}
        {...register('content', {
          maxLength: { value: 5000, message: 'Tối đa 5000 ký tự' },
        })}
        helperText="Lời nhắn sẽ được giấu kín cho đến khi hộp thời gian được mở."
      />

      <Input
        label="URL media (tuỳ chọn)"
        placeholder="https://..."
        {...register('mediaUrl')}
        helperText="Ảnh, video hoặc tài liệu đính kèm (URL)."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          type="date"
          label="Ngày mở khoá"
          leftIcon={<Calendar className="h-4 w-4" />}
          min={new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)}
          error={errors.unlockDate?.message}
          {...register('unlockDate', {
            required: 'Vui lòng chọn ngày mở',
          })}
        />

        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">
            Điều kiện mở
          </label>
          <select
            className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            {...register('unlockCondition')}
          >
            <option value="DATE">Theo ngày</option>
            <option value="EVENT">Theo sự kiện</option>
            <option value="MANUAL">Thủ công (Admin)</option>
          </select>
        </div>
      </div>

      {watched.unlockCondition === 'EVENT' && (
        <Input
          label="Sự kiện mở khoá"
          placeholder="Ví dụ: Lễ tốt nghiệp, Đám cưới..."
          {...register('unlockEvent')}
          helperText="Mô tả sự kiện để Admin biết khi nào mở."
        />
      )}

      {recipients.length > 0 && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">
            Gửi tới thành viên (tuỳ chọn)
          </label>
          <select
            className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            {...register('recipientMemberId')}
          >
            <option value="">-- Không chỉ định --</option>
            {recipients.map((m) => (
              <option key={m.id} value={m.id}>
                {m.fullName}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="rounded-xl border border-dashed border-primary-200 bg-primary-50/40 p-4">
        <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary-800">
          <Sparkles className="h-4 w-4" />
          Xem trước
        </div>
        <p className="text-sm font-semibold text-neutral-900">
          {watched.title || 'Tiêu đề của bạn'}
        </p>
        {watched.content && (
          <p className="mt-1 line-clamp-2 text-xs text-neutral-600">
            {watched.content}
          </p>
        )}
        <div className="mt-2 flex items-center gap-2 text-xs text-neutral-500">
          <Lock className="h-3.5 w-3.5" />
          Mở vào{' '}
          {watched.unlockDate
            ? new Date(watched.unlockDate).toLocaleDateString('vi-VN')
            : '—'}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
        <Button type="submit" loading={createMutation.isPending}>
          Niêm phong hộp thời gian
        </Button>
      </div>

      {preview && (
        <p className="text-xs text-neutral-500">
          Hộp vừa tạo sẽ xuất hiện ở{' '}
          {preview.unlockCondition === 'DATE'
            ? `đếm ngược đến ${preview.unlockDate}`
            : preview.unlockCondition === 'EVENT'
              ? `sự kiện "${preview.unlockEvent || '—'}"`
              : 'khi Admin mở thủ công'}
          .
        </p>
      )}
    </form>
  );
}

export default CreateTimeCapsuleForm;