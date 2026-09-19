'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { generationApi } from '@/lib/api-client';
import type {
  CreateGenerationRequest,
  GenerationResponse,
  GenerationsListResponse,
} from '@/types/family';
import type { MessageResponse } from '@/types/api';

const GENERATION_KEY = ['generations'] as const;

export function useGenerations(
  familyId: string | undefined
): UseQueryResult<GenerationsListResponse, Error> {
  return useQuery<GenerationsListResponse, Error>({
    queryKey: [...GENERATION_KEY, familyId, 'list'],
    queryFn: () => generationApi.list(familyId ?? ''),
    enabled: Boolean(familyId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateGeneration(): UseMutationResult<
  GenerationResponse,
  Error,
  { familyId: string; payload: CreateGenerationRequest }
> {
  const queryClient = useQueryClient();
  return useMutation<
    GenerationResponse,
    Error,
    { familyId: string; payload: CreateGenerationRequest }
  >({
    mutationFn: ({ familyId, payload }) =>
      generationApi.create(familyId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GENERATION_KEY });
      queryClient.invalidateQueries({ queryKey: ['families'] });
    },
  });
}

export function useDeleteGeneration(): UseMutationResult<
  MessageResponse,
  Error,
  string
> {
  const queryClient = useQueryClient();
  return useMutation<MessageResponse, Error, string>({
    mutationFn: (id) => generationApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: GENERATION_KEY });
      queryClient.invalidateQueries({ queryKey: ['families'] });
    },
  });
}
