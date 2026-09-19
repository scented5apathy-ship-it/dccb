'use client';

import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { showToast } from '@/components/ui/Toast';
import { useCreateEvent } from '@/hooks/useEvents';
import type { CreateEventRequest, EventType } from '@/types/event';

export interface CreateEventFormProps {
  familyId: string;
  onSuccess?: (eventId?: string) => void;
}

interface FormValues {
  title: string;
  description: string;
  eventType: EventType;
  eventDate: string;
  endDate: string;
  location: string;
  coverImageUrl: string;
}

const EVENT_TYPES: Array<{ value: EventType; label: string }> = [
  { value: 'WEDDING', label: 'Đám cưới' },
  { value: 'FUNERAL', label: 'Tang lễ / Kỵ giỗ' },
  { value: 'BIRTHDAY', label: 'Sinh nhật' },
  { value: 'ANNIVERSARY', label: 'Kỷ niệm' },
  { value: 'REUNION', label: 'Đoàn tụ gia đình' },
  { value: 'HOLIDAY', label: 'Lễ hội' },
  { value: 'OTHER', label: 'Khác' },
];

function toLocalDateTimeInputValue(d: Date): string {
  // Format Date as YYYY-MM-DDTHH:MM (no seconds, no timezone) for <input type="datetime-local">.
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function CreateEventForm({ familyId, onSuccess }: CreateEventFormProps) {
  const create = useCreateEvent();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      title: '',
      description: '',
      eventType: 'REUNION',
      // Default eventDate to "now + 1 hour" so a freshly created event is
      // guaranteed to land on the "Sắp tới" (Upcoming) tab instead of being
      // silently filtered into "Đã qua" if the user submits without
      // changing the date field.
      eventDate: toLocalDateTimeInputValue(new Date(Date.now() + 60 * 60 * 1000)),
      endDate: '',
      location: '',
      coverImageUrl: '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!values.eventDate) {
      showToast.error('Vui lòng chọn ngày diễn ra');
      return;
    }
    const payload: CreateEventRequest = {
      familyId,
      title: values.title.trim(),
      description: values.description.trim() || undefined,
      eventType: values.eventType,
      eventDate: new Date(values.eventDate).toISOString(),
      endDate: values.endDate ? new Date(values.endDate).toISOString() : undefined,
      location: values.location.trim() || undefined,
      coverImageUrl: values.coverImageUrl.trim() || undefined,
    };
    try {
      const result = await create.mutateAsync(payload);
      showToast.success('Đã tạo sự kiện');
      onSuccess?.(result?.event?.id);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Không thể tạo sự kiện';
      showToast.error('Tạo thất bại', { description: message });
    }
  });

  return (
    <form className="space-y-4" onSubmit={onSubmit} noValidate>
      <Input
        label="Tên sự kiện"
        placeholder="Ví dụ: Đoàn tụ gia đình cuối năm"
        error={errors.title?.message}
        {...register('title', {
          required: 'Vui lòng nhập tên sự kiện',
          maxLength: { value: 200, message: 'Tối đa 200 ký tự' },
        })}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-neutral-700">
            Loại sự kiện
          </label>
          <select
            className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            {...register('eventType')}
          >
            {EVENT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <Input
          type="datetime-local"
          label="Ngày diễn ra"
          error={errors.eventDate?.message}
          {...register('eventDate', { required: 'Vui lòng chọn ngày' })}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          type="datetime-local"
          label="Ngày kết thúc (tuỳ chọn)"
          {...register('endDate')}
        />
        <Input
          label="Địa điểm"
          placeholder="Ví dụ: Nhà ông Hai, Quận 1"
          {...register('location')}
        />
      </div>
      <Input
        label="URL ảnh bìa (tuỳ chọn)"
        placeholder="https://..."
        {...register('coverImageUrl')}
      />
      <Textarea
        label="Mô tả"
        placeholder="Thông tin chi tiết về sự kiện..."
        rows={4}
        {...register('description')}
      />
      <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-3">
        <Button type="submit" loading={create.isPending}>
          Tạo sự kiện
        </Button>
      </div>
    </form>
  );
}

export default CreateEventForm;