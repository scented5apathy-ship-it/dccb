'use client';

import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingState } from '@/components/shared/LoadingState';
import { useFamilyTree } from '@/hooks/useFamily';
import { formatDate, cn } from '@/lib/utils';
import {
  Trees as TreeIcon,
  Heart,
  Users,
  Crown,
  Calendar,
} from 'lucide-react';
import type {
  FamilyTreeGeneration,
  TreeMemberNode,
} from '@/types/family';

export interface FamilyTreeProps {
  familyId: string;
}

export function FamilyTree({ familyId }: FamilyTreeProps) {
  const { data, isLoading, isError, error } = useFamilyTree(familyId);

  if (isLoading) return <LoadingState label="Đang tải cây gia phả..." />;
  if (isError) {
    return (
      <Card padding="lg">
        <EmptyState
          icon={<TreeIcon className="h-10 w-10" />}
          title="Không thể tải cây gia phả"
          description={
            error instanceof Error
              ? error.message
              : 'Đã xảy ra lỗi khi tải cây gia phả.'
          }
        />
      </Card>
    );
  }
  if (!data) return null;

  const generations = data.generations ?? [];
  if (generations.length === 0 || data.totalMembers === 0) {
    return (
      <Card padding="lg">
        <EmptyState
          icon={<TreeIcon className="h-10 w-10" />}
          title="Chưa có thành viên nào"
          description="Hãy thêm thành viên đầu tiên để bắt đầu xây dựng cây gia phả."
          action={
            <Link
              href={`/families/${familyId}/members`}
              className="text-sm font-medium text-primary-600 hover:underline"
            >
              Thêm thành viên
            </Link>
          }
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card
        padding="md"
        className="border border-amber-200/60 bg-gradient-to-br from-amber-50/40 via-white to-primary-50/30"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-soft">
              <TreeIcon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-serif text-lg font-semibold text-neutral-900">
                {data.familyName}
              </h2>
              <p className="text-xs text-neutral-500">
                Tổng <strong className="text-neutral-700">{data.totalMembers}</strong>{' '}
                thành viên trong{' '}
                <strong className="text-neutral-700">
                  {data.totalGenerations}
                </strong>{' '}
                đời.
              </p>
            </div>
          </div>
          <FamilyTreeLegend />
        </div>
      </Card>

      <div className="relative space-y-4">
        {generations.map((gen, idx) => (
          <div key={gen.id ?? gen.generationNumber} className="relative">
            {/* Vertical connector between generations */}
            {idx < generations.length - 1 && (
              <div
                className="absolute left-1/2 top-full z-0 h-4 w-px -translate-x-1/2 bg-gradient-to-b from-amber-300 to-amber-200"
                aria-hidden="true"
              />
            )}
            <GenerationRow
              generation={gen}
              familyId={familyId}
              isFirst={idx === 0}
              isLast={idx === generations.length - 1}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

interface GenerationRowProps {
  generation: FamilyTreeGeneration;
  familyId: string;
  isFirst: boolean;
  isLast: boolean;
}

function GenerationRow({
  generation,
  familyId,
  isFirst,
}: GenerationRowProps) {
  const generationPalette = [
    { bg: 'from-amber-100 to-amber-50', border: 'border-amber-300', text: 'text-amber-900', icon: 'text-amber-700' },
    { bg: 'from-orange-100 to-orange-50', border: 'border-orange-300', text: 'text-orange-900', icon: 'text-orange-700' },
    { bg: 'from-red-100 to-red-50', border: 'border-red-300', text: 'text-red-900', icon: 'text-red-700' },
    { bg: 'from-rose-100 to-rose-50', border: 'border-rose-300', text: 'text-rose-900', icon: 'text-rose-700' },
    { bg: 'from-pink-100 to-pink-50', border: 'border-pink-300', text: 'text-pink-900', icon: 'text-pink-700' },
    { bg: 'from-fuchsia-100 to-fuchsia-50', border: 'border-fuchsia-300', text: 'text-fuchsia-900', icon: 'text-fuchsia-700' },
    { bg: 'from-violet-100 to-violet-50', border: 'border-violet-300', text: 'text-violet-900', icon: 'text-violet-700' },
    { bg: 'from-sky-100 to-sky-50', border: 'border-sky-300', text: 'text-sky-900', icon: 'text-sky-700' },
  ];
  const palette =
    generationPalette[(generation.generationNumber - 1) % generationPalette.length]!;

  return (
    <section className="relative">
      <div
        className={cn(
          'mb-3 flex items-center gap-2 rounded-full border bg-gradient-to-r px-3 py-1.5 shadow-soft',
          palette.bg,
          palette.border
        )}
      >
        {isFirst ? (
          <Crown className={cn('h-4 w-4', palette.icon)} />
        ) : (
          <Badge variant="primary" size="md" className="shrink-0">
            Đời {generation.generationNumber}
          </Badge>
        )}
        <h3 className={cn('text-sm font-semibold', palette.text)}>
          {generation.name ?? `Đời ${generation.generationNumber}`}
        </h3>
        {(generation.startYear ?? generation.endYear) && (
          <span
            className={cn(
              'inline-flex items-center gap-1 text-xs',
              palette.icon,
              'opacity-80'
            )}
          >
            <Calendar className="h-3 w-3" />({generation.startYear ?? '?'} –{' '}
            {generation.endYear ?? 'nay'})
          </span>
        )}
        <span className="ml-auto inline-flex items-center gap-1 text-xs text-neutral-500">
          <Users className="h-3 w-3" />
          {generation.members.length} thành viên
        </span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {generation.members.map((member) => (
          <MemberTreeCard
            key={member.id}
            member={member}
            familyId={familyId}
          />
        ))}
      </div>
    </section>
  );
}

interface MemberTreeCardProps {
  member: TreeMemberNode;
  familyId: string;
  depth?: number;
}

function MemberTreeCard({ member, familyId }: MemberTreeCardProps) {
  const hasChildren = (member.children ?? []).length > 0;
  const hasSpouses = (member.spouses ?? []).length > 0;
  const hasSiblings = (member.siblings ?? []).length > 0;

  return (
    <Card
      padding="md"
      hoverable
      className="group relative border border-neutral-100 bg-white transition hover:border-primary-200 hover:shadow-medium"
    >
      <CardHeader className="mb-2">
        <div className="flex items-center gap-3">
          <Avatar
            src={member.avatarUrl}
            name={member.fullName}
            size="md"
            className="ring-2 ring-white"
          />
          <div className="min-w-0 flex-1">
            <Link
              href={`/members/${member.id}`}
              className="block truncate font-serif text-sm font-semibold text-neutral-900 hover:text-primary-700"
            >
              {member.fullName}
            </Link>
            <p className="truncate text-xs text-neutral-500">
              {member.birthDate
                ? formatDate(member.birthDate)
                : member.occupation ?? '—'}
              {!member.isAlive ? ' · Đã mất' : ''}
            </p>
          </div>
        </div>
      </CardHeader>

      {(member.nickname || hasSpouses || hasChildren || hasSiblings) && (
        <CardContent className="space-y-2">
          {member.nickname && (
            <p className="text-xs italic text-neutral-500">
              &ldquo;{member.nickname}&rdquo;
            </p>
          )}
          {hasSpouses && (
            <div>
              <p className="mb-1 flex items-center gap-1 text-xs font-medium text-neutral-600">
                <Heart className="h-3 w-3 text-red-400" />
                Vợ/Chồng
              </p>
              <div className="flex flex-wrap items-center gap-1">
                {member.spouses.map((sp, idx) => (
                  <span key={sp.id} className="inline-flex items-center">
                    <Link
                      href={`/members/${sp.id}`}
                      className="inline-flex items-center gap-1 rounded-full bg-pink-50 px-2 py-0.5 text-xs text-pink-700 hover:bg-pink-100"
                    >
                      <Heart className="h-2.5 w-2.5 fill-current" />
                      {sp.fullName}
                    </Link>
                    {idx < member.spouses.length - 1 && (
                      <span className="mx-0.5 text-pink-300">·</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
          {hasChildren && (
            <div>
              <p className="mb-1 flex items-center gap-1 text-xs font-medium text-neutral-600">
                <Users className="h-3 w-3 text-primary-500" />
                Con ({member.children.length})
              </p>
              <div className="flex flex-wrap gap-1">
                {member.children.slice(0, 5).map((child) => (
                  <Link
                    key={child.id}
                    href={`/members/${child.id}`}
                    className="rounded-full bg-primary-50 px-2 py-0.5 text-xs text-primary-700 hover:bg-primary-100"
                  >
                    {child.fullName}
                  </Link>
                ))}
                {member.children.length > 5 && (
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
                    +{member.children.length - 5}
                  </span>
                )}
              </div>
            </div>
          )}
          {hasSiblings && (
            <div>
              <p className="mb-1 flex items-center gap-1 text-xs font-medium text-neutral-600">
                <Users className="h-3 w-3 text-neutral-400" />
                Anh chị em ({member.siblings.length})
              </p>
              <div className="flex flex-wrap gap-1">
                {member.siblings.slice(0, 4).map((sib) => (
                  <Link
                    key={sib.id}
                    href={`/members/${sib.id}`}
                    className="rounded-full bg-neutral-50 px-2 py-0.5 text-xs text-neutral-600 hover:bg-neutral-100"
                  >
                    {sib.fullName}
                  </Link>
                ))}
                {member.siblings.length > 4 && (
                  <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
                    +{member.siblings.length - 4}
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export function FamilyTreeLegend() {
  return (
    <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
      <span className="inline-flex items-center gap-1">
        <Heart className="h-3 w-3 fill-pink-400 text-pink-400" /> Vợ/Chồng
      </span>
      <span className="inline-flex items-center gap-1">
        <Users className="h-3 w-3 text-primary-500" /> Con cái
      </span>
      <span className="inline-flex items-center gap-1">
        <Users className="h-3 w-3 text-neutral-400" /> Anh chị em
      </span>
      <span className="inline-flex items-center gap-1">
        <Crown className="h-3 w-3 text-amber-500" /> Thế hệ đầu tiên
      </span>
    </div>
  );
}

export default FamilyTree;