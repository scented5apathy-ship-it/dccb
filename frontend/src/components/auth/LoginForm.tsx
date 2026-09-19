'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { showToast } from '@/components/ui/Toast';
import { useAuth } from '@/hooks/useAuth';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Vui lòng nhập email')
    .email('Email không hợp lệ'),
  password: z
    .string()
    .min(1, 'Vui lòng nhập mật khẩu')
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams?.get('redirect') ?? '/dashboard';
  const { login, isLoading } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginValues) => {
    setSubmitError(null);
    try {
      await login(values);
      showToast.success('Đăng nhập thành công');
      router.replace(redirect);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Đăng nhập thất bại';
      setSubmitError(message);
      showToast.error(message);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
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
        label="Mật khẩu"
        type="password"
        placeholder="••••••••"
        autoComplete="current-password"
        leftIcon={<Lock className="h-4 w-4" />}
        error={errors.password?.message}
        {...register('password')}
      />
      {submitError && (
        <p className="text-sm text-red-600">{submitError}</p>
      )}
      <div className="flex items-center justify-between text-sm">
        <Link
          href="/forgot-password"
          className="text-primary-600 hover:underline"
        >
          Quên mật khẩu?
        </Link>
        <Link href="/register" className="text-primary-600 hover:underline">
          Tạo tài khoản
        </Link>
      </div>
      <Button
        type="submit"
        variant="primary"
        fullWidth
        loading={isLoading}
        size="lg"
      >
        Đăng nhập
      </Button>
    </form>
  );
}

export default LoginForm;
