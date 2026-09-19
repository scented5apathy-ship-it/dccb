'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { storyApi } from '@/lib/api-client';
import type {
  CreateStoryRequest,
  CreateStoryTagRequest,
  PaginatedStories,
  Story,
  StoryDetail,
  StoryListFilters,
  StoryTag,
  StoryTagListItem,
  UpdateStoryRequest,
} from '@/types/story';
import type { MessageResponse } from '@/types/api';

const STORY_KEY = ['stories'] as const;

/** List stories of a family. */
export function useStories(
  familyId: string | undefined,
  filters?: StoryListFilters
): UseQueryResult<PaginatedStories, Error> {
  return useQuery({
    queryKey: [...STORY_KEY, 'list', familyId, filters ?? {}],
    queryFn: () => storyApi.list(familyId as string, filters),
    enabled: Boolean(familyId),
  });
}

/** Get story detail. */
export function useStory(
  id: string | undefined
): UseQueryResult<StoryDetail, Error> {
  return useQuery({
    queryKey: [...STORY_KEY, 'detail', id],
    queryFn: () => storyApi.get(id as string),
    enabled: Boolean(id),
  });
}

/** List every story tag (for the tag selector). */
export function useStoryTags(): UseQueryResult<StoryTagListItem[], Error> {
  return useQuery({
    queryKey: [...STORY_KEY, 'tags'],
    queryFn: () => storyApi.listTags(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateStory(): UseMutationResult<
  StoryDetail,
  Error,
  { familyId: string; payload: CreateStoryRequest }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ familyId, payload }) => storyApi.create(familyId, payload),
    onSuccess: (_data, { familyId }) => {
      queryClient.invalidateQueries({ queryKey: [...STORY_KEY, 'list', familyId] });
      queryClient.invalidateQueries({ queryKey: [...STORY_KEY, 'tags'] });
    },
  });
}

export function useUpdateStory(): UseMutationResult<
  { story: Story },
  Error,
  { id: string; payload: UpdateStoryRequest }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => storyApi.update(id, payload),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: STORY_KEY });
      queryClient.invalidateQueries({ queryKey: [...STORY_KEY, 'detail', id] });
    },
  });
}

export function useDeleteStory(): UseMutationResult<
  MessageResponse,
  Error,
  string
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => storyApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STORY_KEY });
    },
  });
}

export function useCreateStoryTag(): UseMutationResult<
  { tag: StoryTag },
  Error,
  CreateStoryTagRequest
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => storyApi.createTag(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...STORY_KEY, 'tags'] });
    },
  });
}