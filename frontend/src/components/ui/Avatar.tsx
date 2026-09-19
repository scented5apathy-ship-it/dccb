import Image from 'next/image';
import { cn, getInitials } from '@/lib/utils';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  src?: string;
  alt?: string;
  name?: string;
  size?: AvatarSize;
  className?: string;
}

const sizeMap: Record<
  AvatarSize,
  { container: string; text: string; dimensions: number }
> = {
  xs: { container: 'h-6 w-6', text: 'text-[10px]', dimensions: 24 },
  sm: { container: 'h-8 w-8', text: 'text-xs', dimensions: 32 },
  md: { container: 'h-10 w-10', text: 'text-sm', dimensions: 40 },
  lg: { container: 'h-14 w-14', text: 'text-base', dimensions: 56 },
  xl: { container: 'h-20 w-20', text: 'text-xl', dimensions: 80 },
};

export function Avatar({
  src,
  alt,
  name = '',
  size = 'md',
  className,
}: AvatarProps) {
  const initials = getInitials(name) || '?';
  const sizing = sizeMap[size];

  return (
    <div
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary-100 text-primary-700',
        sizing.container,
        className
      )}
      aria-label={alt ?? name}
    >
      {src ? (
        <Image
          src={src}
          alt={alt ?? name}
          width={sizing.dimensions}
          height={sizing.dimensions}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className={cn('font-semibold', sizing.text)}>{initials}</span>
      )}
    </div>
  );
}

export default Avatar;