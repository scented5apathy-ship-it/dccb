'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function MobileMenu({
  open,
  onClose,
  children,
  className,
}: MobileMenuProps) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;
  if (typeof window === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-40 lg:hidden" role="dialog">
      <div
        className="absolute inset-0 bg-neutral-900/50 animate-fade-in"
        onClick={onClose}
      />
      <div
        className={cn(
          'absolute inset-y-0 left-0 w-72 max-w-[80vw] bg-white shadow-large animate-slide-up',
          className
        )}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-lg p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
          aria-label="Đóng menu"
        >
          <X className="h-5 w-5" />
        </button>
        {children}
      </div>
    </div>,
    document.body
  );
}

export default MobileMenu;