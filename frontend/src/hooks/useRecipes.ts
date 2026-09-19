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
  CreateOriginRequest,
  CreateRecipeRequest,
  PaginatedRecipes,
  PublicRecipeFilters,
  RecipeDetail,
  RecipeFilters,
  RecipeGenealogyTree,
  RecipeOrigin,
  ReactionCounts,
  ReactionType,
  RecipeThreadComment,
  UpdateCommentRequest,
  UpdateRecipeRequest,
} from '@/types/recipe';
import type { MessageResponse } from '@/types/api';

const RECIPE_KEY = ['recipes'] as const;

/** List recipes of a family. */
export function useRecipes(
  familyId: string | undefined,
  filters?: RecipeFilters
): UseQueryResult<PaginatedRecipes, Error> {
  return useQuery({
    queryKey: [...RECIPE_KEY, 'family', familyId, filters ?? {}],
    queryFn: () => recipeApi.listFamily(familyId as string, filters),
    enabled: Boolean(familyId),
  });
}

/** Public recipe search. */
export function usePublicRecipes(
  filters?: PublicRecipeFilters
): UseQueryResult<PaginatedRecipes, Error> {
  return useQuery({
    queryKey: [...RECIPE_KEY, 'public', filters ?? {}],
    queryFn: () => recipeApi.searchPublic(filters),
  });
}

/** Recipe detail. */
export function useRecipe(
  id: string | undefined
): UseQueryResult<RecipeDetail, Error> {
  return useQuery({
    queryKey: [...RECIPE_KEY, 'detail', id],
    queryFn: () => recipeApi.get(id as string),
    enabled: Boolean(id),
  });
}

/** Full nested genealogy tree - the showcase feature. */
export function useRecipeGenealogy(
  id: string | undefined
): UseQueryResult<RecipeGenealogyTree, Error> {
  return useQuery({
    queryKey: [...RECIPE_KEY, id, 'genealogy-tree'],
    queryFn: () => recipeApi.genealogyTree(id as string),
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}

/** Flat list of origins for a recipe. */
export function useRecipeOrigins(
  id: string | undefined
): UseQueryResult<RecipeOrigin[], Error> {
  return useQuery({
    queryKey: [...RECIPE_KEY, id, 'origins'],
    queryFn: () => recipeApi.listOrigins(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateRecipe(): UseMutationResult<
  RecipeDetail,
  Error,
  { familyId: string; payload: CreateRecipeRequest }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ familyId, payload }) => recipeApi.create(familyId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECIPE_KEY });
    },
  });
}

export function useUpdateRecipe(): UseMutationResult<
  RecipeDetail,
  Error,
  { id: string; payload: UpdateRecipeRequest }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => recipeApi.update(id, payload),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: RECIPE_KEY });
      queryClient.invalidateQueries({ queryKey: [...RECIPE_KEY, 'detail', id] });
    },
  });
}

export function useDeleteRecipe(): UseMutationResult<
  MessageResponse,
  Error,
  string
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => recipeApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RECIPE_KEY });
    },
  });
}

export function useAddOrigin(): UseMutationResult<
  RecipeOrigin,
  Error,
  { recipeId: string; payload: CreateOriginRequest }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ recipeId, payload }) =>
      recipeApi.addOrigin(recipeId, payload),
    onSuccess: (_data, { recipeId }) => {
      queryClient.invalidateQueries({ queryKey: [...RECIPE_KEY, recipeId, 'genealogy-tree'] });
      queryClient.invalidateQueries({ queryKey: [...RECIPE_KEY, recipeId, 'origins'] });
      queryClient.invalidateQueries({ queryKey: [...RECIPE_KEY, 'detail', recipeId] });
    },
  });
}

/** Mutations for reactions + comments - kept here for convenience. */
export function useReact(): UseMutationResult<
  ReactionCounts,
  Error,
  { recipeId: string; reactionType: ReactionType }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ recipeId, reactionType }) =>
      recipeApi.react(recipeId, reactionType),
    onSuccess: (_data, { recipeId }) => {
      queryClient.invalidateQueries({ queryKey: [...RECIPE_KEY, 'detail', recipeId] });
      queryClient.invalidateQueries({ queryKey: [...RECIPE_KEY, recipeId, 'reactions'] });
    },
  });
}

export function useRemoveReaction(): UseMutationResult<
  MessageResponse,
  Error,
  string
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (recipeId) => recipeApi.removeReaction(recipeId),
    onSuccess: (_data, recipeId) => {
      queryClient.invalidateQueries({ queryKey: [...RECIPE_KEY, 'detail', recipeId] });
      queryClient.invalidateQueries({ queryKey: [...RECIPE_KEY, recipeId, 'reactions'] });
    },
  });
}

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
    mutationFn: ({ recipeId, payload }) => recipeApi.addComment(recipeId, payload),
    onSuccess: (_data, { recipeId }) => {
      queryClient.invalidateQueries({ queryKey: [...RECIPE_KEY, recipeId, 'comments'] });
      queryClient.invalidateQueries({ queryKey: [...RECIPE_KEY, 'detail', recipeId] });
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
    },
  });
}