'use client';

import { Toaster, toast } from 'react-hot-toast';
import type { ReactNode } from 'react';

export type ToastVariant = 'success' | 'error' | 'loading' | 'default';

export interface ShowToastOptions {
  duration?: number;
  description?: string;
}

export const showToast = {
  success: (message: string, opts: ShowToastOptions = {}) =>
    toast.success(opts.description ? `${message}: ${opts.description}` : message, {
      duration: opts.duration ?? 3500,
    }),
  error: (message: string, opts: ShowToastOptions = {}) =>
    toast.error(opts.description ? `${message}: ${opts.description}` : message, {
      duration: opts.duration ?? 5000,
    }),
  loading: (message: string): string => toast.loading(message),
  info: (message: string, opts: ShowToastOptions = {}) =>
    toast(opts.description ? `${message}: ${opts.description}` : message, {
      duration: opts.duration ?? 3500,
      icon: 'ℹ️',
    }),
  dismiss: (id?: string) => toast.dismiss(id),
};

export interface ToastProviderProps {
  children?: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          className:
            '!rounded-lg !bg-white !text-neutral-900 !shadow-medium !border !border-neutral-200',
          style: {
            padding: '12px 16px',
            fontSize: '14px',
          },
          success: {
            iconTheme: {
              primary: '#16a34a',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#dc2626',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
}

export default ToastProvider;