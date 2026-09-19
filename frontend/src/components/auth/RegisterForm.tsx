'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, User, Phone } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { showToast } from '@/components/ui/Toast';
import { useAuth } from '@/hooks/useAuth';

const registerSchema = z.object({
  fullName: z
    .string()
    .min(1, 'Vui lòng nhập họ tên')
    .min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  email: z
    .string()
    .min(1, 'Vui lòng nhập email')
    .email('Email không hợp lệ'),
  phone: z
    .string()
    .trim()
    .optional()
    .refine(
      (val) => !val || /^[0-9+\-\s]{6,20}$/.test(val),
      'Số điện thoại không hợp lệ'
    ),
  password: z
    .string()
    .min(1, 'Vui lòng nhập mật khẩu')
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
});

type RegisterValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const { register: registerAction, isLoading } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', fullName: '', phone: '' },
  });

  const onSubmit = async (values: RegisterValues) => {
    setSubmitError(null);
    try {
      await registerAction({
        email: values.email,
        password: values.password,
        fullName: values.fullName,
        phone: values.phone || undefined,
      });
      showToast.success('Đăng ký thành công');
      router.replace('/dashboard');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Đăng ký thất bại';
      setSubmitError(message);
      showToast.error(message);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Input
        label="Họ và tên"
        placeholder="Nguyễn Văn A"
        autoComplete="name"
        leftIcon={<User className="h-4 w-4" />}
        error={errors.fullName?.message}
        {...register('fullName')}
      />
      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        leftIcon={<Mail className="h-4 w-4" />}
        error={errors.email?.message}
        {...register('email')}
      />
      <Input
        label="Số điện thoại (tuỳ chọn)"
        type="tel"
        placeholder="0901234567"
        autoComplete="tel"
        leftIcon={<Phone className="h-4 w-4" />}
        error={errors.phone?.message}
        {...register('phone')}
      />
      <Input
        label="Mật khẩu"
        type="password"
        placeholder="••••••••"
        autoComplete="new-password"
        leftIcon={<Lock className="h-4 w-4" />}
        error={errors.password?.message}
        {...register('password')}
      />
      {submitError && (
        <p className="text-sm text-red-600">{submitError}</p>
      )}
      <div className="text-sm">
        Đã có tài khoản?{' '}
        <Link href="/login" className="text-primary-600 hover:underline">
          Đăng nhập
        </Link>
      </div>
      <Button
        type="submit"
        variant="primary"
        fullWidth
        loading={isLoading}
        size="lg"
      >
        Tạo tài khoản
      </Button>
    </form>
  );
}

export default RegisterForm;
