import Link from 'next/link';
import { Users, MapPin, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import type { Family } from '@/types/family';

export interface FamilyCardProps {
  family: Family;
}

export function FamilyCard({ family }: FamilyCardProps) {
  return (
    <Link href={`/families/${family.id}`} className="block">
      <Card hoverable padding="md">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold text-neutral-900">
              {family.name}
            </h3>
            {family.origin && (
              <p className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
                <MapPin className="h-3.5 w-3.5" />
                {family.origin}
              </p>
            )}
          </div>
          <Badge variant="primary" size="sm">
            {family.memberCount ?? 0} thành viên
          </Badge>
        </div>
        {family.description && (
          <p className="mt-3 line-clamp-2 text-sm text-neutral-600">
            {family.description}
          </p>
        )}
        <div className="mt-4 flex items-center justify-between text-xs text-neutral-500">
          {family.foundedYear ? (
            <span className="flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              Thành lập {family.foundedYear}
            </span>
          ) : (
            <span />
          )}
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {formatDate(family.createdAt)}
          </span>
        </div>
      </Card>
    </Link>
  );
}

export default FamilyCard;