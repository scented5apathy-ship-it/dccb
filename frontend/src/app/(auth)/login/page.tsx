import { Suspense } from 'react';
import { Card } from '@/components/ui/Card';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata = {
  title: 'Đăng nhập',
};

export default function LoginPage() {
  return (
    <Card padding="lg">
      <h1 className="font-serif text-2xl font-semibold text-neutral-900">
        Chào mừng trở lại
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        Đăng nhập để tiếp tục với cây gia phả của bạn.
      </p>
      <div className="mt-6">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </Card>
  );
}