import Link from 'next/link';
import { Trees } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 py-8 sm:max-w-lg">
        <Link
          href="/"
          className="mb-10 flex items-center gap-2 self-center text-neutral-900"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white">
            <Trees className="h-5 w-5" />
          </div>
          <span className="font-serif text-lg font-semibold">
            Cây Gia Phả Số
          </span>
        </Link>

        <div className="flex-1">{children}</div>

        <footer className="pt-8 text-center text-xs text-neutral-400">
          © 2026 Cây Gia Phả Số
        </footer>
      </div>
    </div>
  );
}