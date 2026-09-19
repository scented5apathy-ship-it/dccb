'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import {
  notificationApi,
  type ListNotificationsParams,
} from '@/lib/api-client';
import type {
  NotificationListResponse,
  NotificationMarkAllReadResponse,
  NotificationMarkReadResponse,
} from '@/types/notification';

const NOTIF_KEY = ['notifications'] as const;

export function useNotifications(
  filters?: ListNotificationsParams
): UseQueryResult<NotificationListResponse, Error> {
  return useQuery({
    queryKey: [...NOTIF_KEY, 'list', filters ?? {}],
    queryFn: () => notificationApi.list(filters),
  });
}

export function useMarkRead(): UseMutationResult<
  NotificationMarkReadResponse,
  Error,
  string
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => notificationApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIF_KEY });
    },
  });
}

export function useMarkAllRead(): UseMutationResult<
  NotificationMarkAllReadResponse,
  Error,
  void
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIF_KEY });
    },
  });
}