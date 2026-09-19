'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui/Spinner';

export interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}

/**
 * Client-side guard that redirects unauthenticated users to `/login`.
 * Place inside any `(main)` layout/page that requires authentication.
 */
export function ProtectedRoute({
  children,
  fallback,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { isAuthenticated, isHydrated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isHydrated && !isAuthenticated) {
      const current =
        typeof window !== 'undefined'
          ? window.location.pathname + window.location.search
          : '/';
      router.replace(`${redirectTo}?redirect=${encodeURIComponent(current)}`);
    }
  }, [isHydrated, isAuthenticated, redirectTo, router]);

  if (!isHydrated) {
    return (
      fallback ?? (
        <div className="flex h-[60vh] items-center justify-center">
          <Spinner size="lg" label="Đang kiểm tra phiên đăng nhập..." />
        </div>
      )
    );
  }

  if (!isAuthenticated) {
    return fallback ?? null;
  }

  return <>{children}</>;
}

export default ProtectedRoute;