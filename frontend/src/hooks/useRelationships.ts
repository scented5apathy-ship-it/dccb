'use client';

import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { relationshipApi } from '@/lib/api-client';
import type {
  CreateRelationshipRequest,
  RelationshipResponse,
  UpdateRelationshipRequest,
} from '@/types/family';
import type { MessageResponse } from '@/types/api';

const RELATIONSHIP_KEY = ['relationships'] as const;

export function useCreateRelationship(): UseMutationResult<
  RelationshipResponse,
  Error,
  CreateRelationshipRequest
> {
  const queryClient = useQueryClient();
  return useMutation<RelationshipResponse, Error, CreateRelationshipRequest>({
    mutationFn: (payload) => relationshipApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RELATIONSHIP_KEY });
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: ['families'] });
    },
  });
}

export function useUpdateRelationship(): UseMutationResult<
  RelationshipResponse,
  Error,
  { id: string; payload: UpdateRelationshipRequest }
> {
  const queryClient = useQueryClient();
  return useMutation<
    RelationshipResponse,
    Error,
    { id: string; payload: UpdateRelationshipRequest }
  >({
    mutationFn: ({ id, payload }) => relationshipApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RELATIONSHIP_KEY });
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
}

export function useDeleteRelationship(): UseMutationResult<
  MessageResponse,
  Error,
  string
> {
  const queryClient = useQueryClient();
  return useMutation<MessageResponse, Error, string>({
    mutationFn: (id) => relationshipApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RELATIONSHIP_KEY });
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
  });
}
