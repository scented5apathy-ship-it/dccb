import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';

export interface LoadingStateProps {
  label?: string;
  className?: string;
  fullScreen?: boolean;
}

export function LoadingState({
  label = 'Đang tải...',
  className,
  fullScreen = false,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center',
        fullScreen ? 'min-h-screen' : 'min-h-[40vh]',
        className
      )}
    >
      <Spinner size="lg" label={label} />
    </div>
  );
}

export default LoadingState;