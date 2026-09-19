'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { memberApi } from '@/lib/api-client';
import type {
  CreateInvitationRequest,
  CreateMemberRequest,
  InvitationDetail,
  InvitationListResponse,
  InvitationResponseWrapper,
  MemberResponse,
  MemberWithRelationships,
  MembersListResponse,
  UpdateMemberRequest,
} from '@/types/family';
import type { MessageResponse } from '@/types/api';

const MEMBER_KEY = ['members'] as const;

export function useMembers(
  familyId: string | undefined,
  params?: { generationId?: string; search?: string; aliveOnly?: boolean }
): UseQueryResult<MembersListResponse, Error> {
  return useQuery<MembersListResponse, Error>({
    queryKey: [...MEMBER_KEY, familyId, 'list', params ?? {}],
    queryFn: () => memberApi.list(familyId ?? '', params),
    enabled: Boolean(familyId),
    staleTime: 60 * 1000,
  });
}

export function useMember(
  id: string | undefined
): UseQueryResult<MemberWithRelationships, Error> {
  return useQuery<MemberWithRelationships, Error>({
    queryKey: [...MEMBER_KEY, 'detail', id],
    queryFn: () => memberApi.get(id ?? ''),
    enabled: Boolean(id),
  });
}

export function useCreateMember(): UseMutationResult<
  MemberResponse,
  Error,
  { familyId: string; payload: CreateMemberRequest }
> {
  const queryClient = useQueryClient();
  return useMutation<
    MemberResponse,
    Error,
    { familyId: string; payload: CreateMemberRequest }
  >({
    mutationFn: ({ familyId, payload }) => memberApi.create(familyId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMBER_KEY });
      queryClient.invalidateQueries({ queryKey: ['families'] });
    },
  });
}

export function useUpdateMember(): UseMutationResult<
  MemberResponse,
  Error,
  { id: string; payload: UpdateMemberRequest }
> {
  const queryClient = useQueryClient();
  return useMutation<
    MemberResponse,
    Error,
    { id: string; payload: UpdateMemberRequest }
  >({
    mutationFn: ({ id, payload }) => memberApi.update(id, payload),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: MEMBER_KEY });
      queryClient.invalidateQueries({ queryKey: [...MEMBER_KEY, 'detail', id] });
    },
  });
}

export function useDeleteMember(): UseMutationResult<
  MessageResponse,
  Error,
  { id: string; familyId?: string }
> {
  const queryClient = useQueryClient();
  return useMutation<
    MessageResponse,
    Error,
    { id: string; familyId?: string }
  >({
    mutationFn: ({ id }) => memberApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMBER_KEY });
      queryClient.invalidateQueries({ queryKey: ['families'] });
    },
  });
}

export function useCreateInvitation(): UseMutationResult<
  InvitationResponseWrapper,
  Error,
  { familyId: string; payload: CreateInvitationRequest }
> {
  const queryClient = useQueryClient();
  return useMutation<
    InvitationResponseWrapper,
    Error,
    { familyId: string; payload: CreateInvitationRequest }
  >({
    mutationFn: ({ familyId, payload }) =>
      memberApi.createInvitation(familyId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
  });
}

const INVITATION_KEY = ['invitations'] as const;

export function useInvitations(
  familyId: string | undefined
): UseQueryResult<InvitationListResponse, Error> {
  return useQuery<InvitationListResponse, Error>({
    queryKey: [...INVITATION_KEY, familyId, 'list'],
    queryFn: () => memberApi.listInvitations(familyId ?? ''),
    enabled: Boolean(familyId),
    staleTime: 30_000,
  });
}

export function useRevokeInvitation(): UseMutationResult<
  MessageResponse,
  Error,
  { invitationId: string; familyId?: string }
> {
  const queryClient = useQueryClient();
  return useMutation<
    MessageResponse,
    Error,
    { invitationId: string; familyId?: string }
  >({
    mutationFn: ({ invitationId }) => memberApi.revokeInvitation(invitationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVITATION_KEY });
    },
  });
}

export function useUpdateMemberRole(): UseMutationResult<
  MemberResponse,
  Error,
  { familyId: string; memberId: string; role: 'ADMIN' | 'EDITOR' | 'VIEWER' }
> {
  const queryClient = useQueryClient();
  return useMutation<
    MemberResponse,
    Error,
    { familyId: string; memberId: string; role: 'ADMIN' | 'EDITOR' | 'VIEWER' }
  >({
    mutationFn: ({ familyId, memberId, role }) =>
      memberApi.updateRole(familyId, memberId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MEMBER_KEY });
      queryClient.invalidateQueries({ queryKey: ['families'] });
      queryClient.invalidateQueries({ queryKey: ['invitations'] });
    },
  });
}

// Re-export so callers can `import { useFamilyMembers } from '@/hooks/useMembers'`.
export { useFamilyMembers } from './useFamily';
