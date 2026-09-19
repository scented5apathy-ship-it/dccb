'use client';

import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { create } from 'zustand';
import {
  clearAuth,
  getRefreshToken,
  getToken,
  getUser,
  setRefreshToken,
  setToken,
  setUser,
} from '@/lib/auth';
import { authApi } from '@/lib/api-client';
import { ApiError } from '@/types/api';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  User,
} from '@/types/user';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  login: (payload: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => void;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: Boolean(getToken()),
  isHydrated: false,
  isLoading: false,
  error: null,
  setUser: (user) => {
    set({ user, isAuthenticated: Boolean(user) });
    if (user) setUser(user);
  },
  hydrate: () => {
    const user = getUser();
    set({
      user,
      isAuthenticated: Boolean(getToken()),
      isHydrated: true,
    });
  },
  login: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authApi.login(payload);
      applyAuth(data);
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      const message = extractErrorMessage(err);
      set({ isLoading: false, error: message });
      throw err;
    }
  },
  register: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authApi.register(payload);
      applyAuth(data);
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      const message = extractErrorMessage(err);
      set({ isLoading: false, error: message });
      throw err;
    }
  },
  logout: async () => {
    const refreshToken = getRefreshToken();
    try {
      await authApi.logout(refreshToken ?? undefined);
    } catch {
      // ignore network errors during logout
    }
    clearAuth();
    set({ user: null, isAuthenticated: false });
  },
}));

function applyAuth(data: AuthResponse): void {
  if (data.accessToken) setToken(data.accessToken);
  if (data.refreshToken) setRefreshToken(data.refreshToken);
  if (data.user) setUser(data.user);
}

function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'Đã xảy ra lỗi, vui lòng thử lại.';
}

export interface UseAuth {
  user: User | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (payload: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  /** Hydrate user from /auth/me (used after token refresh). */
  meQuery: ReturnType<typeof useQuery<User, Error>>;
}

export function useAuth(): UseAuth {
  const {
    user,
    isAuthenticated,
    isHydrated,
    isLoading,
    error,
    login,
    register,
    logout,
    hydrate,
    setUser,
  } = useAuthStore();

  useEffect(() => {
    if (!isHydrated) hydrate();
  }, [isHydrated, hydrate]);

  // Hydrate from /auth/me whenever a token exists but no cached user.
  const queryClient = useQueryClient();
  const meQuery = useQuery<User, Error>({
    queryKey: ['auth', 'me'],
    queryFn: () => authApi.me(),
    enabled: isHydrated && Boolean(getToken()) && !user,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  useEffect(() => {
    if (meQuery.data) {
      setUser(meQuery.data);
      queryClient.setQueryData(['auth', 'me'], meQuery.data);
    }
  }, [meQuery.data, setUser, queryClient]);

  return {
    user,
    isAuthenticated,
    isHydrated,
    isLoading,
    error,
    login,
    register,
    logout,
    setUser,
    meQuery,
  };
}

export function useLogout(): ReturnType<typeof useMutation<void, Error, void>> {
  const { logout } = useAuthStore();
  return useMutation({ mutationFn: () => logout() });
}

export default useAuth;

// Helper exported for error toasts.
export type { ApiError };
