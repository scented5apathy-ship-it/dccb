'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { familyApi, memberApi } from '@/lib/api-client';
import type {
  CreateFamilyRequest,
  CreateMemberRequest,
  FamilyDetail,
  FamilyListResponse,
  FamilyResponse,
  FamilyTreeResponse,
  FamilyWithRole,
  JoinFamilyRequest,
  JoinFamilyResponse,
  MembersListResponse,
  Relationship,
  UpdateFamilyRequest,
} from '@/types/family';
import type { MessageResponse } from '@/types/api';

const FAMILY_KEY = ['families'] as const;

export function useFamilies(): UseQueryResult<FamilyWithRole[], Error> {
  return useQuery<FamilyWithRole[], Error>({
    queryKey: [...FAMILY_KEY, 'list'],
    queryFn: () => familyApi.listFamilies(),
    staleTime: 60 * 1000,
  });
}

export function useFamiliesRaw(): UseQueryResult<FamilyListResponse, Error> {
  return useQuery<FamilyListResponse, Error>({
    queryKey: [...FAMILY_KEY, 'list', 'raw'],
    queryFn: () => familyApi.list(),
    staleTime: 60 * 1000,
  });
}

export function useFamily(
  id: string | undefined
): UseQueryResult<FamilyDetail, Error> {
  return useQuery<FamilyDetail, Error>({
    queryKey: [...FAMILY_KEY, 'detail', id],
    queryFn: () => familyApi.get(id ?? ''),
    enabled: Boolean(id),
  });
}

export function useFamilyTree(
  familyId: string | undefined
): UseQueryResult<FamilyTreeResponse, Error> {
  return useQuery<FamilyTreeResponse, Error>({
    queryKey: [...FAMILY_KEY, familyId, 'tree'],
    queryFn: () => familyApi.getTree(familyId ?? ''),
    enabled: Boolean(familyId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useFamilyMembers(
  familyId: string | undefined,
  params?: { generationId?: string; search?: string; aliveOnly?: boolean }
): UseQueryResult<MembersListResponse, Error> {
  return useQuery<MembersListResponse, Error>({
    queryKey: [...FAMILY_KEY, familyId, 'members', params ?? {}],
    queryFn: () => memberApi.list(familyId ?? '', params),
    enabled: Boolean(familyId),
  });
}

export function useFamilyRelationships(
  familyId: string | undefined
): UseQueryResult<Relationship[], Error> {
  return useQuery<Relationship[], Error>({
    queryKey: [...FAMILY_KEY, familyId, 'relationships'],
    queryFn: () => familyApi.relationships(familyId ?? ''),
    enabled: Boolean(familyId),
  });
}

export function useCreateFamily(): UseMutationResult<
  FamilyResponse,
  Error,
  CreateFamilyRequest
> {
  const queryClient = useQueryClient();
  return useMutation<FamilyResponse, Error, CreateFamilyRequest>({
    mutationFn: (payload) => familyApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FAMILY_KEY });
    },
  });
}

export function useUpdateFamily(): UseMutationResult<
  FamilyResponse,
  Error,
  { id: string; payload: UpdateFamilyRequest }
> {
  const queryClient = useQueryClient();
  return useMutation<
    FamilyResponse,
    Error,
    { id: string; payload: UpdateFamilyRequest }
  >({
    mutationFn: ({ id, payload }) => familyApi.update(id, payload),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: FAMILY_KEY });
      queryClient.invalidateQueries({ queryKey: [...FAMILY_KEY, 'detail', id] });
    },
  });
}

export function useDeleteFamily(): UseMutationResult<
  MessageResponse,
  Error,
  string
> {
  const queryClient = useQueryClient();
  return useMutation<MessageResponse, Error, string>({
    mutationFn: () => Promise.reject(new Error('Not implemented by backend')),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FAMILY_KEY });
    },
  });
}

export function useJoinFamily(): UseMutationResult<
  JoinFamilyResponse,
  Error,
  JoinFamilyRequest
> {
  const queryClient = useQueryClient();
  return useMutation<JoinFamilyResponse, Error, JoinFamilyRequest>({
    mutationFn: (payload) => familyApi.join(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FAMILY_KEY });
    },
  });
}

export function useMember(
  id: string | undefined
): UseQueryResult<ReturnType<typeof memberApi.get> extends Promise<infer T> ? T : never, Error> {
  return useQuery({
    queryKey: ['members', 'detail', id],
    queryFn: () => memberApi.get(id ?? ''),
    enabled: Boolean(id),
  });
}

export function useCreateMember(): UseMutationResult<
  ReturnType<typeof memberApi.create> extends Promise<infer T> ? T : never,
  Error,
  { familyId: string; payload: CreateMemberRequest }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ familyId, payload }) => memberApi.create(familyId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] });
      queryClient.invalidateQueries({ queryKey: FAMILY_KEY });
    },
  });
}
