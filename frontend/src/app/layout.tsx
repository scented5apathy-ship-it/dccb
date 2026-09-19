import type { Metadata, Viewport } from 'next';
import { Inter, Merriweather } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  variable: '--font-inter',
});

const merriweather = Merriweather({
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '700'],
  display: 'swap',
  variable: '--font-merriweather',
});

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? 'Cây Gia Phả Số';

export const metadata: Metadata = {
  title: {
    default: APP_NAME,
    template: `%s · ${APP_NAME}`,
  },
  description:
    'Nền tảng số để xây dựng và lưu giữ cây gia phả, công thức, câu chuyện và hộp thời gian của gia đình bạn.',
  applicationName: APP_NAME,
  keywords: [
    'gia phả',
    'cây gia phả',
    'gia đình',
    'family tree',
    'công thức',
    'truyền thống',
  ],
  authors: [{ name: APP_NAME }],
};

export const viewport: Viewport = {
  themeColor: '#D97706',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="vi"
      className={`${inter.variable} ${merriweather.variable}`}
    >
      <body className="min-h-screen bg-neutral-50 font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}