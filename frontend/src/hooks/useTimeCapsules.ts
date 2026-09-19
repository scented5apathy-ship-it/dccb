'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import {
  timeCapsuleApi,
  type ListTimeCapsulesParams,
} from '@/lib/api-client';
import type {
  CountdownInfo,
  CreateTimeCapsuleRequest,
  OpenTimeCapsuleResponse,
  TimeCapsule,
  TimeCapsuleEntry,
  TimeCapsuleListResponse,
} from '@/types/time-capsule';
import type { MessageResponse } from '@/types/api';

const TC_KEY = ['timeCapsules'] as const;

/**
 * List time capsules in a family. Supports `status` and `recipientId`
 * filters that map directly to the backend.
 */
export function useTimeCapsules(
  familyId: string | undefined,
  filters?: ListTimeCapsulesParams
): UseQueryResult<TimeCapsuleListResponse, Error> {
  return useQuery({
    queryKey: [...TC_KEY, 'list', familyId, filters ?? {}],
    queryFn: () => timeCapsuleApi.list(familyId ?? '', filters),
    enabled: Boolean(familyId),
  });
}

/** Fetch a single time capsule (best-effort). */
export function useTimeCapsule(
  id: string | undefined
): UseQueryResult<TimeCapsuleEntry | null, Error> {
  return useQuery({
    queryKey: [...TC_KEY, 'detail', id],
    queryFn: () => timeCapsuleApi.get(id ?? ''),
    enabled: Boolean(id),
  });
}

interface CreateTimeCapsuleResponse {
  capsule: TimeCapsule;
  daysUntilUnlock?: number;
}

export function useCreateTimeCapsule(): UseMutationResult<
  CreateTimeCapsuleResponse,
  Error,
  CreateTimeCapsuleRequest
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      timeCapsuleApi.create(payload.familyId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TC_KEY });
    },
  });
}

/**
 * Open a time capsule. The backend returns the freshly-unlocked capsule
 * along with its decrypted content.
 */
export function useOpenTimeCapsule(): UseMutationResult<
  OpenTimeCapsuleResponse,
  Error,
  string
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => timeCapsuleApi.open(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: TC_KEY });
      queryClient.invalidateQueries({ queryKey: [...TC_KEY, 'detail', id] });
    },
  });
}

export function useDeleteTimeCapsule(): UseMutationResult<
  MessageResponse,
  Error,
  { id: string; familyId?: string }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => timeCapsuleApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TC_KEY });
    },
  });
}

function computeCountdown(target: number): CountdownInfo {
  const totalMs = target - Date.now();
  if (totalMs <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isUnlocked: true,
      totalMs: 0,
    };
  }
  const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((totalMs / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((totalMs / (1000 * 60)) % 60);
  const seconds = Math.floor((totalMs / 1000) % 60);
  return { days, hours, minutes, seconds, isUnlocked: false, totalMs };
}

/**
 * Live countdown that ticks every second. Pass either an ISO string or a
 * `Date`. Stops automatically once unlocked.
 */
export function useCountdown(target: string | Date): CountdownInfo {
  const targetMs =
    typeof target === 'string' ? new Date(target).getTime() : target.getTime();
  const [countdown, setCountdown] = useState<CountdownInfo>(() =>
    computeCountdown(targetMs)
  );

  useEffect(() => {
    setCountdown(computeCountdown(targetMs));
    if (countdown.isUnlocked) return;
    const id = window.setInterval(() => {
      const next = computeCountdown(targetMs);
      setCountdown(next);
      if (next.isUnlocked) window.clearInterval(id);
    }, 1000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetMs]);

  return countdown;
}