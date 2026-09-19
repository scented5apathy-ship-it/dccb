'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { MobileMenu } from '@/components/layout/MobileMenu';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-neutral-50">
        <div className="hidden lg:block">
          <Sidebar />
        </div>
        <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)}>
          <Sidebar />
        </MobileMenu>
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar onMenuClick={() => setMenuOpen(true)} />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}