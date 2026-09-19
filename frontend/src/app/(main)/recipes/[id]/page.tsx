'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { showToast } from '@/components/ui/Toast';
import { RecipeHero } from '@/components/recipe/RecipeHero';
import { RecipeIngredients } from '@/components/recipe/RecipeIngredients';
import { RecipeSteps } from '@/components/recipe/RecipeSteps';
import { RecipeReactions } from '@/components/recipe/RecipeReactions';
import { RecipeComments } from '@/components/recipe/RecipeComments';
import { RecipeGenealogy } from '@/components/recipe/RecipeGenealogy';
import { useAuth } from '@/hooks/useAuth';
import {
  useDeleteRecipe,
  useRecipe,
  useRecipeGenealogy,
} from '@/hooks/useRecipes';

export default function RecipeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const recipeId = params.id;
  const { data: recipe, isLoading, error } = useRecipe(recipeId);
  const { data: genealogy } = useRecipeGenealogy(recipeId);
  const deleteRecipe = useDeleteRecipe();
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" label="Đang tải công thức…" />
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="space-y-3">
        <Link href="/recipes" className="text-sm text-primary-600 hover:text-primary-800">
          ← Quay lại danh sách
        </Link>
        <Card padding="lg">
          <p className="text-sm text-neutral-600">
            Không tìm thấy công thức hoặc bạn không có quyền truy cập.
          </p>
        </Card>
      </div>
    );
  }

  const isAuthor = recipe.recipe.authorId === user?.id;
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'admin';

  const onDelete = async () => {
    try {
      await deleteRecipe.mutateAsync(recipeId);
      showToast.success('Đã xoá công thức');
      router.push('/recipes');
    } catch (e) {
      showToast.error('Không thể xoá', { description: e instanceof Error ? e.message : '' });
    } finally {
      setConfirmDelete(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link
        href="/recipes"
        className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800"
      >
        <ArrowLeft className="h-4 w-4" /> Danh sách công thức
      </Link>

      <RecipeHero
        recipe={recipe.recipe}
        author={recipe.author ?? null}
        onEdit={isAuthor || isAdmin ? () => router.push(`/recipes/${recipeId}/edit`) : undefined}
        onDelete={isAuthor || isAdmin ? () => setConfirmDelete(true) : undefined}
      />

      {/* Family heritage story */}
      {recipe.recipe.story && (
        <Card padding="md">
          <h2 className="font-serif text-base font-semibold text-neutral-900">
            Câu chuyện gia đình
          </h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">
            {recipe.recipe.story}
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <RecipeSteps steps={recipe.steps} instructions={recipe.recipe.instructions} />
          <RecipeComments recipeId={recipeId} />
        </div>
        <aside className="space-y-6">
          <RecipeIngredients ingredients={recipe.ingredients} />
          <RecipeReactions
            recipeId={recipeId}
            initialCounts={
              recipe.reactions
                ? {
                    like: recipe.reactions.like ?? recipe.reactions.want_to_try ?? 0,
                    love: recipe.reactions.love ?? 0,
                    yum: recipe.reactions.yum ?? 0,
                    wantToTry:
                      recipe.reactions.wantToTry ?? recipe.reactions.want_to_try ?? 0,
                  }
                : undefined
            }
            userReaction={recipe.userReaction ?? null}
          />
        </aside>
      </div>

      {/* Genealogy - the showcase feature */}
      <RecipeGenealogy
        tree={genealogy ?? null}
        buildMemberHref={(memberId) => `/members/${memberId}`}
      />

      <ConfirmDialog
        open={confirmDelete}
        title="Xoá công thức"
        description="Hành động này sẽ xoá vĩnh viễn công thức, nguyên liệu, bước nấu và lịch sử truyền dạy."
        confirmText="Xoá"
        variant="danger"
        loading={deleteRecipe.isPending}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={onDelete}
      />

      {deleteRecipe.isPending && (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-white/40">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      )}

      {!isAuthor && !isAdmin && recipe.recipe.familyId && (
        <div className="text-center">
          <Link href={`/families/${recipe.recipe.familyId}/recipes`}>
            <Button variant="outline">Xem thêm công thức của gia đình này</Button>
          </Link>
        </div>
      )}
    </div>
  );
}