'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { recipeApi } from '@/lib/api-client';
import type {
  CreateCommentRequest,
  ReactionCounts,
  ReactionType,
  RecipeThreadComment,
  UpdateCommentRequest,
} from '@/types/recipe';
import type { MessageResponse } from '@/types/api';

const RECIPE_KEY = ['recipes'] as const;
const RECIPE_DETAIL_KEY = (id: string) => [...RECIPE_KEY, 'detail', id] as const;

/** Reaction counts for a recipe (from /reactions GET). */
export function useRecipeReactions(
  recipeId: string | undefined
): UseQueryResult<ReactionCounts, Error> {
  return useQuery({
    queryKey: [...RECIPE_KEY, recipeId, 'reactions'],
    queryFn: () => recipeApi.reactions(recipeId as string),
    enabled: Boolean(recipeId),
  });
}

/**
 * Toggle a reaction: applies the given reaction if different from current,
 * otherwise removes the reaction. Returns the latest counts.
 */
export function useToggleReaction(): UseMutationResult<
  ReactionCounts,
  Error,
  { recipeId: string; reactionType: ReactionType; currentReaction?: ReactionType | null }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ recipeId, reactionType, currentReaction }) => {
      if (currentReaction === reactionType) {
        await recipeApi.removeReaction(recipeId);
        // Fetch latest counts after removal.
        return recipeApi.reactions(recipeId);
      }
      return recipeApi.react(recipeId, reactionType);
    },
    onSuccess: (_data, { recipeId }) => {
      queryClient.invalidateQueries({ queryKey: RECIPE_DETAIL_KEY(recipeId) });
      queryClient.invalidateQueries({ queryKey: [...RECIPE_KEY, recipeId, 'reactions'] });
    },
  });
}

/** Threaded comments for a recipe. */
export function useRecipeComments(
  recipeId: string | undefined
): UseQueryResult<RecipeThreadComment[], Error> {
  return useQuery({
    queryKey: [...RECIPE_KEY, recipeId, 'comments'],
    queryFn: () => recipeApi.comments(recipeId as string),
    enabled: Boolean(recipeId),
  });
}

export function useAddComment(): UseMutationResult<
  RecipeThreadComment,
  Error,
  { recipeId: string; payload: CreateCommentRequest }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ recipeId, payload }) =>
      recipeApi.addComment(recipeId, payload),
    onSuccess: (_data, { recipeId }) => {
      queryClient.invalidateQueries({ queryKey: [...RECIPE_KEY, recipeId, 'comments'] });
      queryClient.invalidateQueries({ queryKey: RECIPE_DETAIL_KEY(recipeId) });
    },
  });
}

export function useUpdateComment(): UseMutationResult<
  RecipeThreadComment,
  Error,
  { commentId: string; recipeId: string; payload: UpdateCommentRequest }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, payload }) =>
      recipeApi.updateComment(commentId, payload),
    onSuccess: (_data, { recipeId }) => {
      queryClient.invalidateQueries({ queryKey: [...RECIPE_KEY, recipeId, 'comments'] });
    },
  });
}

export function useDeleteComment(): UseMutationResult<
  MessageResponse,
  Error,
  { commentId: string; recipeId: string }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId }) => recipeApi.deleteComment(commentId),
    onSuccess: (_data, { recipeId }) => {
      queryClient.invalidateQueries({ queryKey: [...RECIPE_KEY, recipeId, 'comments'] });
      queryClient.invalidateQueries({ queryKey: RECIPE_DETAIL_KEY(recipeId) });
    },
  });
}