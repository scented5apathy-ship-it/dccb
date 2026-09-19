import { Card } from '@/components/ui/Card';
import { RegisterForm } from '@/components/auth/RegisterForm';

export const metadata = {
  title: 'Đăng ký',
};

export default function RegisterPage() {
  return (
    <Card padding="lg">
      <h1 className="font-serif text-2xl font-semibold text-neutral-900">
        Tạo tài khoản
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        Bắt đầu xây dựng cây gia phả số của gia đình bạn.
      </p>
      <div className="mt-6">
        <RegisterForm />
      </div>
    </Card>
  );
}