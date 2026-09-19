'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Trees } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { showToast } from '@/components/ui/Toast';
import { useCreateFamily } from '@/hooks/useFamily';

const createSchema = z.object({
  name: z
    .string()
    .min(1, 'Vui lòng nhập tên gia đình')
    .min(2, 'Tên phải có ít nhất 2 ký tự')
    .max(200, 'Tên không quá 200 ký tự'),
  description: z.string().max(1000, 'Mô tả không quá 1000 ký tự').optional(),
  foundedYear: z
    .union([
      z.string().transform((v) => (v === '' ? undefined : Number(v))),
      z.number(),
    ])
    .optional()
    .refine(
      (val) => {
        if (val === undefined || Number.isNaN(val)) return true;
        return val >= 1000 && val <= new Date().getFullYear();
      },
      'Năm thành lập không hợp lệ'
    ),
  motto: z.string().max(255, 'Phương ngôn không quá 255 ký tự').optional(),
  originLocation: z.string().max(255, 'Quá dài').optional(),
});

type CreateValues = z.infer<typeof createSchema>;

export default function NewFamilyPage() {
  const router = useRouter();
  const createMutation = useCreateFamily();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      name: '',
      description: '',
      foundedYear: '' as unknown as number,
      motto: '',
      originLocation: '',
    },
  });

  const onSubmit = async (values: CreateValues) => {
    try {
      const payload = {
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        foundedYear:
          typeof values.foundedYear === 'number'
            ? values.foundedYear
            : undefined,
        motto: values.motto?.trim() || undefined,
        originLocation: values.originLocation?.trim() || undefined,
      };
      const result = await createMutation.mutateAsync(payload);
      showToast.success('Đã tạo gia đình mới');
      if (result?.family?.id) {
        router.push(`/families/${result.family.id}`);
      } else {
        router.push('/families');
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Không thể tạo gia đình';
      showToast.error(message);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/families"
          className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700"
        >
          <ArrowLeft className="h-4 w-4" /> Quay lại
        </Link>
        <h1 className="mt-2 font-serif text-2xl font-semibold text-neutral-900">
          Tạo gia đình mới
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Bắt đầu xây dựng cây gia phả số cho dòng họ của bạn.
        </p>
      </div>

      <Card padding="lg">
        <CardHeader
          title="Thông tin gia đình"
          description="Các trường có dấu * là bắt buộc."
        />
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
            <Input
              label="Tên gia đình *"
              placeholder="VD: Họ Nguyễn làng Đông"
              error={errors.name?.message}
              leftIcon={<Trees className="h-4 w-4" />}
              {...register('name')}
            />
            <Textarea
              label="Mô tả"
              placeholder="Vài dòng giới thiệu về dòng họ của bạn..."
              rows={3}
              error={errors.description?.message}
              {...register('description')}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Năm thành lập"
                type="number"
                placeholder="VD: 1850"
                min={1000}
                max={new Date().getFullYear()}
                error={errors.foundedYear?.message as string | undefined}
                {...register('foundedYear')}
              />
              <Input
                label="Phương ngôn"
                placeholder="VD: Hiếu học, đoàn kết"
                error={errors.motto?.message}
                {...register('motto')}
              />
            </div>
            <Input
              label="Quê quán / Nơi thành lập"
              placeholder="VD: Làng Đông, Hà Nội"
              error={errors.originLocation?.message}
              {...register('originLocation')}
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <Link href="/families">
                <Button type="button" variant="ghost">
                  Huỷ
                </Button>
              </Link>
              <Button
                type="submit"
                variant="primary"
                loading={createMutation.isPending}
                leftIcon={<Trees className="h-4 w-4" />}
              >
                Tạo gia đình
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
