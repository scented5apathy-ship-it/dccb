import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface SpinnerProps {
  size?: SpinnerSize;
  className?: string;
  label?: string;
}

const sizeMap: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-10 w-10',
};

export function Spinner({ size = 'md', className, label }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={label ?? 'Đang tải'}
      className={cn('inline-flex items-center gap-2 text-primary-600', className)}
    >
      <Loader2 className={cn('animate-spin', sizeMap[size])} />
      {label && <span className="text-sm text-neutral-700">{label}</span>}
    </span>
  );
}

export default Spinner;