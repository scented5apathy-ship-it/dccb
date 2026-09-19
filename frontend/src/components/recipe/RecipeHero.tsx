'use client';

import { Clock, Users, ChefHat, Globe2 } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { formatRelativeTime, formatDate } from '@/lib/utils';
import type { Recipe, UserSummary } from '@/types/recipe';

export interface RecipeHeroProps {
  recipe: Recipe;
  author?: UserSummary | null;
  onEdit?: () => void;
  onDelete?: () => void;
}

const difficultyLabels: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' }> = {
  easy: { label: 'Dễ', variant: 'success' },
  EASY: { label: 'Dễ', variant: 'success' },
  medium: { label: 'Trung bình', variant: 'warning' },
  MEDIUM: { label: 'Trung bình', variant: 'warning' },
  hard: { label: 'Khó', variant: 'danger' },
  HARD: { label: 'Khó', variant: 'danger' },
};

export function RecipeHero({ recipe, author, onEdit, onDelete }: RecipeHeroProps) {
  const totalTime = (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0);
  const diffMeta = recipe.difficulty ? difficultyLabels[recipe.difficulty] : undefined;
  const cover = recipe.imageUrl ?? recipe.coverImageUrl;

  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-soft">
      <div className="relative aspect-[21/9] w-full bg-gradient-to-br from-primary-100 via-amber-50 to-accent-100">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={recipe.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-primary-400">
            <ChefHat className="h-20 w-20" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap gap-2">
                {recipe.cuisineType && (
                  <Badge variant="primary" size="md">
                    <Globe2 className="h-3 w-3" /> {recipe.cuisineType}
                  </Badge>
                )}
                {diffMeta && (
                  <Badge variant={diffMeta.variant} size="md">
                    Độ khó: {diffMeta.label}
                  </Badge>
                )}
                {recipe.isPublic && (
                  <Badge variant="info" size="md">Công khai</Badge>
                )}
              </div>
              <h1 className="mt-3 font-serif text-3xl font-bold text-white drop-shadow sm:text-4xl">
                {recipe.title}
              </h1>
              {recipe.description && (
                <p className="mt-2 max-w-3xl text-sm text-white/90 drop-shadow sm:text-base">
                  {recipe.description}
                </p>
              )}
            </div>
            {(onEdit || onDelete) && (
              <div className="flex shrink-0 gap-2">
                {onEdit && (
                  <button
                    onClick={onEdit}
                    className="rounded-lg bg-white/95 px-3 py-1.5 text-sm font-medium text-neutral-800 shadow-sm transition hover:bg-white"
                  >
                    Chỉnh sửa
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={onDelete}
                    className="rounded-lg bg-red-600/90 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-red-700"
                  >
                    Xoá
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-neutral-100 p-5">
        <div className="flex items-center gap-3">
          <Avatar
            name={author?.fullName ?? 'Tác giả'}
            src={author?.avatarUrl}
            size="md"
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-neutral-900">
              {author?.fullName ?? 'Tác giả ẩn danh'}
            </p>
            <p className="text-xs text-neutral-500">
              Đăng {formatRelativeTime(recipe.createdAt)}
              {recipe.createdAt ? ` · ${formatDate(recipe.createdAt)}` : ''}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600">
          {totalTime > 0 && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-primary-600" />
              <strong className="font-medium text-neutral-900">{totalTime}</strong> phút
              {(recipe.prepTimeMinutes ?? 0) > 0 && (recipe.cookTimeMinutes ?? 0) > 0 && (
                <span className="text-xs text-neutral-400">
                  ({recipe.prepTimeMinutes} chuẩn bị + {recipe.cookTimeMinutes} nấu)
                </span>
              )}
            </span>
          )}
          {recipe.servings && (
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-primary-600" />
              <strong className="font-medium text-neutral-900">{recipe.servings}</strong> người
            </span>
          )}
          {recipe.viewCount !== undefined && (
            <span className="text-xs text-neutral-500">
              {recipe.viewCount.toLocaleString('vi-VN')} lượt xem
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

export default RecipeHero;