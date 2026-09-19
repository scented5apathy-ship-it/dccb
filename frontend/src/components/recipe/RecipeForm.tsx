'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Image as ImageIcon, ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { MemberSelector } from '@/components/shared/MemberSelector';
import type { CreateRecipeRequest, Difficulty } from '@/types/recipe';
import type { FamilyMember } from '@/types/family';

const ingredientSchema = z.object({
  name: z.string().min(1, 'Tên nguyên liệu không được trống'),
  quantity: z.string().optional(),
  unit: z.string().optional(),
  notes: z.string().optional(),
});

const stepSchema = z.object({
  instruction: z.string().min(1, 'Mô tả bước không được trống'),
  durationMinutes: z.string().optional(),
  imageUrl: z.string().optional(),
});

const originSchema = z.object({
  fromMemberId: z.string().min(1, 'Chọn người truyền'),
  toMemberId: z.string().min(1, 'Chọn người nhận'),
  yearTransmitted: z.string().optional(),
  generationGap: z.string().optional(),
  story: z.string().optional(),
});

const recipeSchema = z.object({
  title: z.string().min(1, 'Vui lòng nhập tên công thức').max(200),
  description: z.string().optional(),
  story: z.string().optional(),
  cuisineType: z.string().optional(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
  prepTimeMinutes: z.string().optional(),
  cookTimeMinutes: z.string().optional(),
  servings: z.string().optional(),
  instructions: z.string().optional(),
  imageUrl: z.string().optional(),
  isPublic: z.boolean().optional(),
  ingredients: z.array(ingredientSchema).default([]),
  steps: z.array(stepSchema).default([]),
  origins: z.array(originSchema).default([]),
});

export type RecipeFormValues = z.infer<typeof recipeSchema>;

export interface RecipeFormProps {
  familyId?: string;
  members?: FamilyMember[];
  initialValues?: Partial<RecipeFormValues>;
  onSubmit: (data: CreateRecipeRequest) => Promise<void> | void;
  submitting?: boolean;
}

export function RecipeForm({
  members = [],
  initialValues,
  onSubmit,
  submitting,
}: RecipeFormProps) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<RecipeFormValues>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      title: initialValues?.title ?? '',
      description: initialValues?.description ?? '',
      story: initialValues?.story ?? '',
      cuisineType: initialValues?.cuisineType ?? '',
      difficulty: initialValues?.difficulty ?? 'MEDIUM',
      prepTimeMinutes: String(initialValues?.prepTimeMinutes ?? '0'),
      cookTimeMinutes: String(initialValues?.cookTimeMinutes ?? '0'),
      servings: String(initialValues?.servings ?? '2'),
      instructions: initialValues?.instructions ?? '',
      imageUrl: initialValues?.imageUrl ?? '',
      isPublic: initialValues?.isPublic ?? false,
      ingredients: initialValues?.ingredients ?? [],
      steps: initialValues?.steps ?? [],
      origins: initialValues?.origins ?? [],
    },
  });

  const ingredients = useFieldArray({ control, name: 'ingredients' });
  const steps = useFieldArray({ control, name: 'steps' });
  const origins = useFieldArray({ control, name: 'origins' });

  const submit = async (values: RecipeFormValues) => {
    const payload: CreateRecipeRequest = {
      title: values.title,
      description: values.description || undefined,
      story: values.story || undefined,
      cuisineType: values.cuisineType || undefined,
      difficulty: values.difficulty as Difficulty,
      prepTimeMinutes: numOrUndef(values.prepTimeMinutes),
      cookTimeMinutes: numOrUndef(values.cookTimeMinutes),
      servings: numOrUndef(values.servings),
      instructions: values.instructions || undefined,
      imageUrl: values.imageUrl || undefined,
      isPublic: values.isPublic,
      ingredients: values.ingredients.map((ing, idx) => ({
        name: ing.name,
        quantity: ing.quantity || undefined,
        unit: ing.unit || undefined,
        notes: ing.notes || undefined,
        orderIndex: idx,
      })),
      steps: values.steps.map((s, idx) => ({
        stepNumber: idx + 1,
        instruction: s.instruction,
        durationMinutes: numOrUndef(s.durationMinutes),
        imageUrl: s.imageUrl || undefined,
      })),
      origins: values.origins
        .filter((o) => o.fromMemberId && o.toMemberId)
        .map((o) => ({
          fromMemberId: o.fromMemberId,
          toMemberId: o.toMemberId,
          yearTransmitted: numOrUndef(o.yearTransmitted),
          generationGap: numOrUndef(o.generationGap),
          story: o.story || undefined,
        })),
    };
    await onSubmit(payload);
  };

  const watchOrigins = watch('origins') ?? [];
  const updateFrom = (idx: number, ids: string[]) => {
    const first = ids[0];
    setValue(`origins.${idx}.fromMemberId`, first ?? '');
  };
  const updateTo = (idx: number, ids: string[]) => {
    const first = ids[0];
    setValue(`origins.${idx}.toMemberId`, first ?? '');
  };

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6" noValidate>
      <Section title="Thông tin cơ bản" description="Tên, mô tả và các thông số nấu">
        <Input
          label="Tên công thức *"
          placeholder="Ví dụ: Bún bò Huế"
          {...register('title')}
          error={errors.title?.message}
        />
        <Textarea
          label="Mô tả"
          placeholder="Mô tả ngắn về công thức..."
          rows={2}
          {...register('description')}
        />
        <Textarea
          label="Câu chuyện gia đình"
          placeholder="Câu chuyện về công thức này trong gia đình..."
          rows={3}
          {...register('story')}
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Input
            label="Chuẩn bị (phút)"
            type="number"
            {...register('prepTimeMinutes')}
          />
          <Input
            label="Nấu (phút)"
            type="number"
            {...register('cookTimeMinutes')}
          />
          <Input
            label="Khẩu phần"
            type="number"
            {...register('servings')}
          />
          <div className="w-full">
            <label className="mb-1.5 block text-sm font-medium text-neutral-700">
              Độ khó
            </label>
            <select
              className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
              {...register('difficulty')}
            >
              <option value="EASY">Dễ</option>
              <option value="MEDIUM">Trung bình</option>
              <option value="HARD">Khó</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Input
            label="Phong cách ẩm thực"
            placeholder="Ví dụ: Miền Bắc, Chay..."
            {...register('cuisineType')}
          />
          <Input
            label="URL ảnh bìa"
            placeholder="https://..."
            leftIcon={<ImageIcon className="h-3.5 w-3.5" />}
            {...register('imageUrl')}
          />
          <label className="flex items-end gap-2 text-sm text-neutral-700">
            <input type="checkbox" {...register('isPublic')} className="rounded" />
            Công khai công thức
          </label>
        </div>
        <Textarea
          label="Hướng dẫn chung"
          placeholder="Tóm tắt phương pháp nấu..."
          rows={2}
          {...register('instructions')}
        />
      </Section>

      <Section
        title="Nguyên liệu"
        description={`${ingredients.fields.length} món`}
      >
        {ingredients.fields.length === 0 && (
          <p className="text-sm text-neutral-500">Chưa có nguyên liệu nào.</p>
        )}
        <div className="space-y-2">
          {ingredients.fields.map((field, idx) => (
            <div
              key={field.id}
              className="grid grid-cols-1 gap-2 rounded-lg border border-neutral-200 bg-white p-3 sm:grid-cols-12"
            >
              <Input
                placeholder="Tên nguyên liệu"
                className="sm:col-span-4"
                {...register(`ingredients.${idx}.name` as const)}
                error={errors.ingredients?.[idx]?.name?.message}
              />
              <Input
                placeholder="Số lượng"
                className="sm:col-span-2"
                {...register(`ingredients.${idx}.quantity` as const)}
              />
              <Input
                placeholder="Đơn vị"
                className="sm:col-span-2"
                {...register(`ingredients.${idx}.unit` as const)}
              />
              <Input
                placeholder="Ghi chú"
                className="sm:col-span-3"
                {...register(`ingredients.${idx}.notes` as const)}
              />
              <button
                type="button"
                onClick={() => ingredients.remove(idx)}
                className="rounded-md border border-neutral-300 p-2 text-red-500 hover:bg-red-50 sm:col-span-1"
                aria-label="Xoá"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => ingredients.append({ name: '' })}
        >
          Thêm nguyên liệu
        </Button>
      </Section>

      <Section title="Các bước thực hiện" description={`${steps.fields.length} bước`}>
        {steps.fields.length === 0 && (
          <p className="text-sm text-neutral-500">Chưa có bước nào.</p>
        )}
        <div className="space-y-2">
          {steps.fields.map((field, idx) => (
            <div
              key={field.id}
              className="rounded-lg border border-neutral-200 bg-white p-3"
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-600 text-xs font-semibold text-white">
                  {idx + 1}
                </span>
                <span className="text-sm font-medium text-neutral-700">
                  Bước {idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => steps.remove(idx)}
                  className="ml-auto rounded-md border border-neutral-300 p-1.5 text-red-500 hover:bg-red-50"
                  aria-label="Xoá"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <Textarea
                placeholder="Mô tả bước..."
                rows={2}
                {...register(`steps.${idx}.instruction` as const)}
                error={errors.steps?.[idx]?.instruction?.message}
              />
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Input
                  label="Thời gian (phút)"
                  type="number"
                  {...register(`steps.${idx}.durationMinutes` as const)}
                />
                <Input
                  label="Ảnh minh hoạ (URL)"
                  placeholder="https://..."
                  leftIcon={<ImageIcon className="h-3.5 w-3.5" />}
                  {...register(`steps.${idx}.imageUrl` as const)}
                />
              </div>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => steps.append({ instruction: '' })}
        >
          Thêm bước
        </Button>
      </Section>

      <Section
        title="Nguồn gốc truyền dạy"
        description="Ai truyền cho ai - hiển thị trên cây gia phả công thức"
        right={
          <Badge variant="info" size="sm">
            <ChefHat className="h-3 w-3" /> Tính năng nổi bật
          </Badge>
        }
      >
        {origins.fields.length === 0 && (
          <p className="text-sm text-neutral-500">
            Chưa có thông tin truyền dạy. Bạn có thể bổ sung sau.
          </p>
        )}
        <div className="space-y-3">
          {origins.fields.map((field, idx) => (
            <div
              key={field.id}
              className="rounded-lg border border-neutral-200 bg-white p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-semibold text-neutral-700">
                  Truyền dạy #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => origins.remove(idx)}
                  className="rounded-md border border-neutral-300 p-1.5 text-red-500 hover:bg-red-50"
                  aria-label="Xoá"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                    Người truyền
                  </label>
                  <MemberSelector
                    members={members}
                    value={
                      watchOrigins[idx]?.fromMemberId
                        ? [watchOrigins[idx]!.fromMemberId!]
                        : []
                    }
                    onChange={(ids) => updateFrom(idx, ids)}
                    multiple={false}
                    placeholder="Chọn người truyền..."
                  />
                  <input
                    type="hidden"
                    {...register(`origins.${idx}.fromMemberId` as const)}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                    Người nhận
                  </label>
                  <MemberSelector
                    members={members}
                    value={
                      watchOrigins[idx]?.toMemberId
                        ? [watchOrigins[idx]!.toMemberId!]
                        : []
                    }
                    onChange={(ids) => updateTo(idx, ids)}
                    multiple={false}
                    placeholder="Chọn người nhận..."
                  />
                  <input
                    type="hidden"
                    {...register(`origins.${idx}.toMemberId` as const)}
                  />
                </div>
                <Input
                  label="Năm truyền"
                  type="number"
                  {...register(`origins.${idx}.yearTransmitted` as const)}
                />
                <Input
                  label="Cách bao nhiêu đời"
                  type="number"
                  {...register(`origins.${idx}.generationGap` as const)}
                />
              </div>
              <Textarea
                label="Câu chuyện truyền dạy"
                placeholder="Ví dụ: Bà ngoại truyền cho mẹ khi mẹ 18 tuổi..."
                rows={2}
                {...register(`origins.${idx}.story` as const)}
                className="mt-3"
              />
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => origins.append({ fromMemberId: '', toMemberId: '' })}
        >
          Thêm lần truyền dạy
        </Button>
      </Section>

      <div className="flex justify-end">
        <Button type="submit" loading={submitting}>
          Lưu công thức
        </Button>
      </div>
    </form>
  );
}

function numOrUndef(v: string | number | undefined): number | undefined {
  if (v === '' || v === undefined || v === null) return undefined;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function Section({
  title,
  description,
  right,
  children,
}: {
  title: string;
  description?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-soft">
      <header className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-base font-semibold text-neutral-900">
            {title}
          </h3>
          {description && <p className="text-xs text-neutral-500">{description}</p>}
        </div>
        {right}
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export default RecipeForm;