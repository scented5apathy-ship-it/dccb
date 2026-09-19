import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import {
  Trees,
  UtensilsCrossed,
  BookOpen,
  Clock,
  Calendar,
  ShieldCheck,
} from 'lucide-react';

export const metadata = {
  title: 'Trang chủ',
  description:
    'Cây Gia Phả Số — nền tảng số để lưu giữ và chia sẻ di sản gia đình.',
};

const features = [
  {
    icon: Trees,
    title: 'Cây gia phả số',
    description:
      'Sơ đồ trực quan, thêm thành viên và quan hệ chỉ trong vài cú nhấp.',
  },
  {
    icon: UtensilsCrossed,
    title: 'Công thức gia đình',
    description:
      'Ghi lại công thức nấu ăn và nguồn gốc truyền lại qua từng thế hệ.',
  },
  {
    icon: BookOpen,
    title: 'Câu chuyện & kỷ vật',
    description:
      'Viết và lưu giữ những câu chuyện, hình ảnh quý giá của dòng họ.',
  },
  {
    icon: Clock,
    title: 'Hộp thời gian',
    description:
      'Niêm phong thông điệp và mở vào một ngày đặc biệt trong tương lai.',
  },
  {
    icon: Calendar,
    title: 'Sự kiện dòng họ',
    description:
      'Lên kế hoạch đám giỗ, họp mặt và các dịp kỷ niệm của gia đình.',
  },
  {
    icon: ShieldCheck,
    title: 'Riêng tư & an toàn',
    description:
      'Mời thành viên tham gia với nhiều cấp quyền khác nhau.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 via-white to-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white">
            <Trees className="h-5 w-5" />
          </div>
          <span className="text-base font-semibold text-neutral-900">
            Cây Gia Phả Số
          </span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost">Đăng nhập</Button>
          </Link>
          <Link href="/register">
            <Button variant="primary">Bắt đầu</Button>
          </Link>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-16">
        <section className="py-16 text-center sm:py-24">
          <h1 className="font-serif text-4xl font-bold text-neutral-900 sm:text-5xl">
            Lưu giữ di sản gia đình
            <br />
            <span className="text-primary-600">cho thế hệ mai sau</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-600">
            Cây Gia Phả Số giúp bạn số hoá cây gia phả, công thức nấu ăn, câu
            chuyện và những kỷ vật của dòng họ — tất cả ở một nơi duy nhất.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/register">
              <Button variant="primary" size="lg">
                Tạo tài khoản miễn phí
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg">
                Đăng nhập
              </Button>
            </Link>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} padding="lg" variant="bordered">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-neutral-900">
                  {feature.title}
                </h3>
                <p className="mt-1.5 text-sm text-neutral-600">
                  {feature.description}
                </p>
              </Card>
            );
          })}
        </section>

        <section className="mt-16 text-center text-xs text-neutral-400">
          © 2026 Cây Gia Phả Số · AncestryTree
        </section>
      </main>
    </div>
  );
}