'use client';

import { Clock } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import type { RecipeStep } from '@/types/recipe';

export interface RecipeStepsProps {
  steps: RecipeStep[];
  instructions?: string;
}

export function RecipeSteps({ steps, instructions }: RecipeStepsProps) {
  const ordered = [...steps].sort((a, b) => {
    const oa = a.stepNumber ?? a.order ?? 0;
    const ob = b.stepNumber ?? b.order ?? 0;
    return oa - ob;
  });

  if (ordered.length === 0 && !instructions) {
    return (
      <Card padding="md">
        <CardHeader title="Các bước thực hiện" />
        <p className="text-sm text-neutral-500">
          Chưa có hướng dẫn chi tiết cho công thức này.
        </p>
      </Card>
    );
  }

  return (
    <Card padding="md">
      <CardHeader
        title="Các bước thực hiện"
        description={ordered.length > 0 ? `${ordered.length} bước` : undefined}
      />

      {instructions && (
        <div className="mb-4 rounded-lg bg-amber-50 p-3 text-sm leading-relaxed text-neutral-800">
          <p className="font-medium text-amber-800">Hướng dẫn chung</p>
          <p className="mt-1 whitespace-pre-wrap">{instructions}</p>
        </div>
      )}

      <ol className="space-y-5">
        {ordered.map((step, idx) => (
          <li
            key={step.id ?? idx}
            className="flex gap-4 rounded-xl border border-neutral-100 bg-white p-4 shadow-soft"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-600 text-sm font-semibold text-white">
              {(step.stepNumber ?? step.order ?? idx + 1)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-800">
                {step.instruction ?? step.description ?? ''}
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                {step.durationMinutes !== undefined && step.durationMinutes > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {step.durationMinutes} phút
                  </span>
                )}
              </div>
              {step.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={step.imageUrl}
                  alt={`Bước ${idx + 1}`}
                  className="mt-3 max-h-64 w-full rounded-lg object-cover"
                />
              )}
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}

export default RecipeSteps;