import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { ApiError } from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== 'undefined') {
      const token = window.localStorage.getItem('auth_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response interceptor: handle 401 errors globally and surface the backend's
// `message` field as the AxiosError's `message` so downstream `catch`
// handlers that do `err.message` actually see the user-facing reason instead
// of the generic "Request failed with status code NNN" axios string.
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('auth_token');
        window.localStorage.removeItem('auth_user');
        const currentPath = window.location.pathname;
        if (!currentPath.startsWith('/login')) {
          window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
        }
      }
    }
    // Prefer the backend's structured message over axios's default string.
    const backendMsg = error.response?.data?.message;
    if (backendMsg && typeof backendMsg === 'string') {
      // Replace `message` so `err.message` reflects the real reason.
      try {
        // Mutating the message is the only field axios exposes for surfaced errors.
        error.message = backendMsg;
      } catch {
        // Some axios builds make `message` non-writable; fall back to attaching
        // a custom field consumers can opt into.
        (error as AxiosError & { backendMessage?: string }).backendMessage = backendMsg;
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;