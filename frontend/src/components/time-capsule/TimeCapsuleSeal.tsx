'use client';

import { Lock, Unlock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TimeCapsuleSealProps {
  status: 'sealed' | 'available' | 'opened';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'h-12 w-12',
  md: 'h-16 w-16',
  lg: 'h-24 w-24',
};

const iconSizeMap = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-8 w-8',
};

const textSizeMap = {
  sm: 'text-[9px]',
  md: 'text-[11px]',
  lg: 'text-sm',
};

/**
 * Decorative wax seal used to give locked time capsules a sense of
 * permanence. When the capsule is `available` we render a "sẵn sàng"
 * variant; once `opened` the seal is broken and shows a cracked ribbon.
 */
export function TimeCapsuleSeal({
  status,
  size = 'md',
  className,
}: TimeCapsuleSealProps) {
  const text =
    status === 'sealed' ? 'NIÊM PHONG' : status === 'available' ? 'SẴN SÀNG' : 'ĐÃ MỞ';
  const Icon = status === 'sealed' ? Lock : status === 'available' ? Unlock : Check;
  const palette =
    status === 'sealed'
      ? {
          bg: 'from-red-700 via-red-600 to-red-800',
          ring: 'ring-red-400/40',
          text: 'text-red-50',
          dot: 'border-red-300/60',
        }
      : status === 'available'
        ? {
            bg: 'from-amber-500 via-amber-400 to-amber-600',
            ring: 'ring-amber-300/60',
            text: 'text-amber-50',
            dot: 'border-amber-200/80',
          }
        : {
            bg: 'from-stone-600 via-stone-500 to-stone-700',
            ring: 'ring-stone-300/40',
            text: 'text-stone-100',
            dot: 'border-stone-300/40',
          };

  return (
    <div
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center rounded-full shadow-medium ring-2',
        sizeMap[size],
        'bg-gradient-to-br',
        palette.bg,
        palette.ring,
        status === 'opened' && 'opacity-80',
        status !== 'opened' && 'animate-[seal-float_4s_ease-in-out_infinite]',
        className
      )}
      aria-hidden="true"
    >
      {/* Inner border */}
      <span
        className={cn(
          'absolute inset-1 rounded-full border-2 border-dashed',
          palette.dot
        )}
        aria-hidden="true"
      />
      {/* Outer thin border */}
      <span
        className="absolute inset-[3px] rounded-full border border-white/20"
        aria-hidden="true"
      />
      {/* Center icon */}
      <div
        className={cn(
          'relative flex flex-col items-center justify-center gap-0.5',
          palette.text
        )}
      >
        <Icon className={iconSizeMap[size]} strokeWidth={2.5} />
        <span
          className={cn(
            'font-bold uppercase tracking-wider',
            textSizeMap[size]
          )}
        >
          {status === 'opened' ? 'MỞ' : status === 'sealed' ? 'NIÊM' : 'MỞ'}
        </span>
      </div>
      {/* Cracked overlay when opened */}
      {status === 'opened' && (
        <>
          <span
            className="absolute inset-0 rotate-12 rounded-full border border-white/30"
            aria-hidden="true"
          />
          <span
            className="absolute inset-0 -rotate-12 rounded-full border border-white/20"
            aria-hidden="true"
          />
        </>
      )}
      {/* Highlight gloss */}
      <span
        className="pointer-events-none absolute inset-x-2 top-1 h-1/3 rounded-full bg-white/15 blur-sm"
        aria-hidden="true"
      />
    </div>
  );
}

export default TimeCapsuleSeal;