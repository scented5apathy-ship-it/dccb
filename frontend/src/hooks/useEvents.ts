'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import {
  eventApi,
  type ListEventsParams,
} from '@/lib/api-client';
import type {
  CreateEventRequest,
  CreateEventResponse,
  EventEntry,
  EventListResponse,
  EventPhotoEntry,
  EventPhotoListResponse,
  EventPhotoRequest,
  FamilyEvent,
  RsvpRequest,
  UpdateEventRequest,
} from '@/types/event';
import type { MessageResponse } from '@/types/api';

const EVENT_KEY = ['events'] as const;

/** List events for a family with optional filters. */
export function useEvents(
  familyId: string | undefined,
  filters?: ListEventsParams
): UseQueryResult<EventListResponse, Error> {
  return useQuery({
    queryKey: [...EVENT_KEY, 'list', familyId, filters ?? {}],
    queryFn: () => eventApi.list(familyId ?? '', filters),
    enabled: Boolean(familyId),
  });
}

export function useEvent(
  id: string | undefined
): UseQueryResult<EventEntry | null, Error> {
  return useQuery({
    queryKey: [...EVENT_KEY, 'detail', id],
    queryFn: () => eventApi.get(id ?? ''),
    enabled: Boolean(id),
  });
}

export function useCreateEvent(): UseMutationResult<
  CreateEventResponse,
  Error,
  CreateEventRequest
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => eventApi.create(payload.familyId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVENT_KEY });
    },
  });
}

export function useUpdateEvent(): UseMutationResult<
  { event: FamilyEvent },
  Error,
  { id: string; payload: UpdateEventRequest }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => eventApi.update(id, payload),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: EVENT_KEY });
      queryClient.invalidateQueries({ queryKey: [...EVENT_KEY, 'detail', id] });
    },
  });
}

export function useDeleteEvent(): UseMutationResult<
  MessageResponse,
  Error,
  string
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => eventApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVENT_KEY });
    },
  });
}

export function useRsvp(): UseMutationResult<
  { attendee: unknown },
  Error,
  { eventId: string; payload: RsvpRequest }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, payload }) => eventApi.rsvp(eventId, payload),
    onSuccess: (_data, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: EVENT_KEY });
      queryClient.invalidateQueries({
        queryKey: [...EVENT_KEY, 'detail', eventId],
      });
      queryClient.invalidateQueries({
        queryKey: [...EVENT_KEY, eventId, 'photos'],
      });
    },
  });
}

export function useEventPhotos(
  eventId: string | undefined
): UseQueryResult<EventPhotoListResponse, Error> {
  return useQuery({
    queryKey: [...EVENT_KEY, eventId, 'photos'],
    queryFn: () => eventApi.listPhotos(eventId ?? ''),
    enabled: Boolean(eventId),
  });
}

export function useAddEventPhoto(): UseMutationResult<
  { photo: unknown },
  Error,
  { eventId: string; payload: EventPhotoRequest }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, payload }) => eventApi.addPhoto(eventId, payload),
    onSuccess: (_data, { eventId }) => {
      queryClient.invalidateQueries({
        queryKey: [...EVENT_KEY, eventId, 'photos'],
      });
    },
  });
}