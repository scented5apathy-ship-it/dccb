'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useStoryTags, useCreateStoryTag } from '@/hooks/useStories';
import { MemberSelector } from '@/components/shared/MemberSelector';
import type { CreateStoryRequest, StoryTag } from '@/types/story';
import type { FamilyMember } from '@/types/family';

const storySchema = z.object({
  title: z.string().min(1, 'Vui lòng nhập tiêu đề').max(200),
  content: z.string().min(10, 'Nội dung tối thiểu 10 ký tự'),
  storyDate: z.string().optional(),
  storyLocation: z.string().optional(),
  relatedMemberIds: z.array(z.string()).optional(),
  relatedGenerationId: z.string().optional(),
  isFeatured: z.boolean().optional(),
  media: z
    .array(
      z.object({
        mediaType: z.string(),
        mediaUrl: z.string().url('URL không hợp lệ'),
        caption: z.string().optional(),
      })
    )
    .optional(),
  tagIds: z.array(z.string()).optional(),
});

export type StoryFormValues = z.infer<typeof storySchema>;

export interface StoryFormProps {
  familyId: string;
  members: FamilyMember[];
  initialValues?: Partial<StoryFormValues>;
  onSubmit: (data: CreateStoryRequest) => Promise<void> | void;
  submitting?: boolean;
}

export function StoryForm({
  familyId,
  members,
  initialValues,
  onSubmit,
  submitting,
}: StoryFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<StoryFormValues>({
    resolver: zodResolver(storySchema),
    defaultValues: {
      title: initialValues?.title ?? '',
      content: initialValues?.content ?? '',
      storyDate: initialValues?.storyDate ?? '',
      storyLocation: initialValues?.storyLocation ?? '',
      relatedMemberIds: initialValues?.relatedMemberIds ?? [],
      isFeatured: initialValues?.isFeatured ?? false,
      media: initialValues?.media ?? [],
      tagIds: initialValues?.tagIds ?? [],
    },
  });

  const { data: tags } = useStoryTags();
  const createTag = useCreateStoryTag();
  const [newTag, setNewTag] = useState('');

  const tagIds = watch('tagIds') ?? [];
  const media = watch('media') ?? [];
  const relatedMemberIds = watch('relatedMemberIds') ?? [];

  const submit = async (values: StoryFormValues) => {
    await onSubmit({
      title: values.title,
      content: values.content,
      storyDate: values.storyDate || undefined,
      storyLocation: values.storyLocation || undefined,
      relatedMemberIds: values.relatedMemberIds,
      relatedGenerationId: values.relatedGenerationId || undefined,
      isFeatured: values.isFeatured,
      media: values.media,
      tagIds: values.tagIds,
    } as CreateStoryRequest);
  };

  const toggleTag = (id: string) => {
    const next = tagIds.includes(id) ? tagIds.filter((t) => t !== id) : [...tagIds, id];
    setValue('tagIds', next);
  };

  const addTag = async () => {
    const name = newTag.trim();
    if (!name) return;
    try {
      const res = await createTag.mutateAsync({ name });
      if (res.tag?.id) {
        toggleTag(res.tag.id);
      }
      setNewTag('');
    } catch {
      // toast handled by mutation or silently ignore
    }
  };

  // Tag list - try both shapes: StoryTagListItem[] or plain StoryTag[]
  const tagOptions: StoryTag[] = (tags ?? [])
      .map((t) => ('tag' in (t as unknown as Record<string, unknown>) ? (t as unknown as { tag: StoryTag }).tag : (t as unknown as StoryTag)))
      .filter(Boolean);

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6" noValidate>
      <Section title="Thông tin cơ bản" description="Tiêu đề, nội dung và ngày xảy ra">
        <Input
          label="Tiêu đề *"
          placeholder="Ví dụ: Kỷ niệm Tết năm 1990 của dòng họ..."
          {...register('title')}
          error={errors.title?.message}
        />
        <Textarea
          label="Nội dung *"
          placeholder="Kể câu chuyện của bạn..."
          rows={8}
          {...register('content')}
          error={errors.content?.message}
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            type="date"
            label="Ngày xảy ra"
            {...register('storyDate')}
          />
          <Input
            label="Địa điểm"
            placeholder="Ví dụ: Hà Nội"
            {...register('storyLocation')}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-neutral-700">
          <input type="checkbox" {...register('isFeatured')} className="rounded" />
          Đánh dấu câu chuyện nổi bật
        </label>
      </Section>

      <Section title="Thành viên liên quan" description="Các thành viên được nhắc đến trong câu chuyện">
        <MemberSelector
          members={members}
          value={relatedMemberIds}
          onChange={(ids) => setValue('relatedMemberIds', ids)}
          placeholder="Chọn thành viên…"
        />
      </Section>

      <Section title="Media" description="Thêm ảnh, video hoặc audio minh hoạ">
        {media.length === 0 && (
          <p className="text-sm text-neutral-500">Chưa có media nào.</p>
        )}
        <div className="space-y-2">
          {media.map((_, idx) => (
            <div
              key={idx}
              className="grid grid-cols-1 gap-2 rounded-lg border border-neutral-200 bg-white p-3 sm:grid-cols-12"
            >
              <select
                className="rounded-md border border-neutral-300 px-2 py-1.5 text-sm sm:col-span-3"
                {...register(`media.${idx}.mediaType` as const)}
                defaultValue="IMAGE"
              >
                <option value="IMAGE">Hình ảnh</option>
                <option value="VIDEO">Video</option>
                <option value="AUDIO">Âm thanh</option>
                <option value="DOCUMENT">Tài liệu</option>
              </select>
              <Input
                placeholder="https://..."
                className="sm:col-span-5"
                leftIcon={<ImageIcon className="h-3.5 w-3.5" />}
                {...register(`media.${idx}.mediaUrl` as const)}
                error={errors.media?.[idx]?.mediaUrl?.message}
              />
              <Input
                placeholder="Chú thích"
                className="sm:col-span-3"
                {...register(`media.${idx}.caption` as const)}
              />
              <button
                type="button"
                onClick={() => {
                  const next = media.filter((_, i) => i !== idx);
                  setValue('media', next);
                }}
                className="rounded-md border border-neutral-300 p-2 text-red-500 hover:bg-red-50 sm:col-span-1"
                aria-label="Xoá"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() =>
              setValue('media', [...media, { mediaType: 'IMAGE', mediaUrl: '' }])
            }
          >
            Thêm media
          </Button>
        </div>
      </Section>

      <Section title="Tags" description="Phân loại câu chuyện">
        <div className="flex flex-wrap gap-2">
          {tagOptions.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                tagIds.includes(tag.id)
                  ? 'bg-primary-600 text-white'
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              #{tag.name}
            </button>
          ))}
          {tagOptions.length === 0 && (
            <Badge variant="default" size="md">Chưa có tag nào</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Tạo tag mới (vd: hồi tưởng, gia đình...)"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={addTag}
            loading={createTag.isPending}
          >
            Tạo tag
          </Button>
        </div>
      </Section>

      <div className="flex justify-end gap-3">
        <Button type="submit" loading={submitting}>
          Đăng câu chuyện
        </Button>
      </div>
    </form>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-soft">
      <header className="mb-4">
        <h3 className="font-serif text-base font-semibold text-neutral-900">{title}</h3>
        {description && <p className="text-xs text-neutral-500">{description}</p>}
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export default StoryForm;