import { Badge, type BadgeProps } from '@/components/ui/Badge';

export interface GenerationBadgeProps extends Omit<BadgeProps, 'children'> {
  generation: number;
}

export function GenerationBadge({
  generation,
  ...props
}: GenerationBadgeProps) {
  return (
    <Badge variant="primary" size="sm" {...props}>
      Đời {generation}
    </Badge>
  );
}

export default GenerationBadge;