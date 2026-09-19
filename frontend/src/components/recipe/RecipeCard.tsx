import Link from 'next/link';
import { Clock, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { truncate } from '@/lib/utils';
import type { Recipe } from '@/types/recipe';

export interface RecipeCardProps {
  recipe: Recipe;
}

export function RecipeCard({ recipe }: RecipeCardProps) {
  const totalTime =
    (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0);
  const coverUrl = recipe.coverImageUrl ?? recipe.imageUrl;

  return (
    <Link href={`/recipes/${recipe.id}`} className="block">
      <Card hoverable padding="none" className="overflow-hidden">
        <div className="aspect-[16/10] w-full bg-gradient-to-br from-primary-100 to-accent-100">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt={recipe.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-primary-400">
              <span className="text-4xl">🍲</span>
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="line-clamp-1 text-base font-semibold text-neutral-900">
              {recipe.title}
            </h3>
            {recipe.difficulty && (
              <Badge
                variant={
                  String(recipe.difficulty).toLowerCase() === 'easy'
                    ? 'success'
                    : String(recipe.difficulty).toLowerCase() === 'medium'
                      ? 'warning'
                      : 'danger'
                }
                size="sm"
              >
                {String(recipe.difficulty).toLowerCase() === 'easy'
                  ? 'Dễ'
                  : String(recipe.difficulty).toLowerCase() === 'medium'
                    ? 'Trung bình'
                    : 'Khó'}
              </Badge>
            )}
          </div>
          {recipe.description && (
            <p className="mt-1.5 line-clamp-2 text-sm text-neutral-600">
              {truncate(recipe.description, 120)}
            </p>
          )}
          <div className="mt-3 flex items-center gap-4 text-xs text-neutral-500">
            {totalTime > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {totalTime} phút
              </span>
            )}
            {recipe.servings && (
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {recipe.servings} người
              </span>
            )}
            {recipe.cuisineType && (
              <Badge variant="default" size="sm">
                {recipe.cuisineType}
              </Badge>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}

export default RecipeCard;