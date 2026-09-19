'use client';

import { useState } from 'react';
import { Heart, Smile, ThumbsUp, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import type { ReactionCounts, ReactionType } from '@/types/recipe';
import { useToggleReaction } from '@/hooks/useRecipeInteractions';

export interface RecipeReactionsProps {
  recipeId: string;
  initialCounts: ReactionCounts | undefined;
  userReaction?: ReactionType | null;
  disabled?: boolean;
}

interface ReactionButton {
  type: ReactionType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
  bgAccent: string;
}

const REACTIONS: ReactionButton[] = [
  {
    type: 'LIKE',
    label: 'Thích',
    icon: ThumbsUp,
    accent: 'text-blue-600',
    bgAccent: 'bg-blue-50 ring-blue-200',
  },
  {
    type: 'LOVE',
    label: 'Yêu thích',
    icon: Heart,
    accent: 'text-rose-600',
    bgAccent: 'bg-rose-50 ring-rose-200',
  },
  {
    type: 'YUM',
    label: 'Ngon',
    icon: Smile,
    accent: 'text-amber-600',
    bgAccent: 'bg-amber-50 ring-amber-200',
  },
  {
    type: 'WANT_TO_TRY',
    label: 'Muốn thử',
    icon: Sparkles,
    accent: 'text-violet-600',
    bgAccent: 'bg-violet-50 ring-violet-200',
  },
];

export function RecipeReactions({
  recipeId,
  initialCounts,
  userReaction,
  disabled,
}: RecipeReactionsProps) {
  const [counts, setCounts] = useState<ReactionCounts>(initialCounts ?? {
    like: 0, love: 0, yum: 0, wantToTry: 0,
  });
  const [active, setActive] = useState<ReactionType | null>(userReaction ?? null);
  const toggle = useToggleReaction();

  const total =
    (counts.like ?? 0) +
    (counts.love ?? 0) +
    (counts.yum ?? 0) +
    (counts.wantToTry ?? 0);

  const handleClick = async (type: ReactionType) => {
    if (disabled) return;
    const next = active === type ? null : type;
    setActive(next);
    // Optimistic count adjustment
    setCounts((prev) => adjustCounts(prev, active, next));
    try {
      const result = await toggle.mutateAsync({ recipeId, reactionType: type, currentReaction: active });
      setCounts(result);
    } catch {
      // revert on failure
      setActive(active);
      setCounts(initialCounts ?? { like: 0, love: 0, yum: 0, wantToTry: 0 });
    }
  };

  return (
    <Card padding="md">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-neutral-900">
          Phản ứng
          <span className="ml-2 text-xs font-normal text-neutral-500">
            {total.toLocaleString('vi-VN')} lượt
          </span>
        </h3>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {REACTIONS.map((r) => {
          const Icon = r.icon;
          const isActive = active === r.type;
          const count =
            r.type === 'LIKE'
              ? counts.like
              : r.type === 'LOVE'
                ? counts.love
                : r.type === 'YUM'
                  ? counts.yum
                  : counts.wantToTry;
          return (
            <button
              key={r.type}
              type="button"
              onClick={() => handleClick(r.type)}
              disabled={disabled}
              className={cn(
                'group flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-all',
                'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
                isActive
                  ? `${r.bgAccent} ring-2 ring-inset ${r.accent} border-transparent`
                  : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50',
                disabled && 'cursor-not-allowed opacity-60'
              )}
              aria-pressed={isActive}
            >
              <Icon
                className={cn(
                  'h-4 w-4 transition-transform',
                  isActive ? `${r.accent} scale-110` : 'text-neutral-500 group-hover:text-neutral-700'
                )}
              />
              <span className="hidden sm:inline">{r.label}</span>
              <span className={cn('ml-1 text-xs font-semibold', isActive ? r.accent : 'text-neutral-500')}>
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}

function adjustCounts(
  prev: ReactionCounts,
  from: ReactionType | null,
  to: ReactionType | null
): ReactionCounts {
  const next: ReactionCounts = { ...prev };
  const keyOf = (t: ReactionType) =>
    t === 'LIKE' ? 'like' : t === 'LOVE' ? 'love' : t === 'YUM' ? 'yum' : 'wantToTry';
  if (from) (next as unknown as Record<string, number>)[keyOf(from)] = ((prev as unknown as Record<string, number>)[keyOf(from)] ?? 1) - 1;
  if (to) (next as unknown as Record<string, number>)[keyOf(to)] = ((prev as unknown as Record<string, number>)[keyOf(to)] ?? 0) + 1;
  return next;
}

export default RecipeReactions;