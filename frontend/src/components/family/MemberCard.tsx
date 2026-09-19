import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import type { FamilyMember } from '@/types/family';

export interface MemberCardProps {
  member: FamilyMember;
}

export function MemberCard({ member }: MemberCardProps) {
  return (
    <Link href={`/members/${member.id}`} className="block">
      <Card hoverable padding="md">
        <div className="flex items-center gap-4">
          <Avatar
            src={member.avatarUrl}
            name={member.fullName}
            size="md"
          />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold text-neutral-900">
              {member.fullName}
            </h3>
            <p className="mt-0.5 truncate text-xs text-neutral-500">
              {member.birthPlace ?? '—'}
              {member.dateOfBirth ? ` · ${formatDate(member.dateOfBirth)}` : ''}
            </p>
          </div>
          {typeof member.generation === 'number' && (
            <Badge variant="primary" size="sm">
              Đời {member.generation}
            </Badge>
          )}
        </div>
      </Card>
    </Link>
  );
}

export default MemberCard;