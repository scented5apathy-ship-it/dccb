import type { ReactNode } from 'react';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/shared/EmptyState';
import { Sparkles } from 'lucide-react';

export interface PlaceholderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  children?: ReactNode;
}

/**
 * Shared "coming soon" surface used by stub pages.
 */
export function Placeholder({
  title,
  description,
  icon,
  children,
}: PlaceholderProps) {
  return (
    <Card padding="lg">
      <EmptyState
        icon={icon ?? <Sparkles className="h-10 w-10" />}
        title={title}
        description={
          description ??
          'Trang này hiện đang được phát triển. Vui lòng quay lại sau.'
        }
      />
      {children && <div className="mt-6">{children}</div>}
    </Card>
  );
}

export default Placeholder;