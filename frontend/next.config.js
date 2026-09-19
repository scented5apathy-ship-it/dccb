/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
      {
        // Pravatar — fallback avatars for seeded users.
        protocol: 'https',
        hostname: 'i.pravatar.cc',
      },
      {
        // QR codes are now generated locally with the `qrcode` npm package
        // and rendered as inline SVG, so no external image host is needed.
        // (api.qrserver.com intentionally removed — see components/ui/QrCode.tsx.)
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
};

module.exports = nextConfig;