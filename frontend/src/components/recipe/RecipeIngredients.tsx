'use client';

import { Card, CardHeader } from '@/components/ui/Card';
import { ListChecks } from 'lucide-react';
import type { Ingredient } from '@/types/recipe';

export interface RecipeIngredientsProps {
  ingredients: Ingredient[];
}

export function RecipeIngredients({ ingredients }: RecipeIngredientsProps) {
  if (!ingredients || ingredients.length === 0) {
    return (
      <Card padding="md">
        <CardHeader title="Nguyên liệu" />
        <p className="text-sm text-neutral-500">
          Chưa có nguyên liệu nào được ghi lại.
        </p>
      </Card>
    );
  }

  return (
    <Card padding="md">
      <CardHeader
        title="Nguyên liệu"
        description={`${ingredients.length} món`}
        action={<ListChecks className="h-5 w-5 text-primary-500" />}
      />
      <ul className="space-y-2">
        {ingredients.map((ing, idx) => (
          <li
            key={ing.id ?? `${idx}-${ing.name}`}
            className="flex items-baseline gap-3 rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2"
          >
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-100 text-[10px] font-semibold text-primary-700">
              {idx + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-neutral-900">{ing.name}</p>
              {ing.notes && (
                <p className="mt-0.5 text-xs text-neutral-500">{ing.notes}</p>
              )}
            </div>
            {(ing.quantity || ing.unit) && (
              <span className="shrink-0 text-sm font-semibold text-primary-700">
                {ing.quantity ?? ''}
                {ing.unit ? ` ${ing.unit}` : ''}
              </span>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default RecipeIngredients;