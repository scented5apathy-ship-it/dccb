'use client';

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { albumApi } from '@/lib/api-client';
import type {
  AddPhotoRequest,
  CreateAlbumRequest,
  PhotoAlbumListResponse,
  PhotoListResponse,
} from '@/types/photo-album';

const ALBUM_KEY = ['albums'] as const;

export function useAlbums(
  familyId: string | undefined
): UseQueryResult<PhotoAlbumListResponse, Error> {
  return useQuery({
    queryKey: [...ALBUM_KEY, 'list', familyId],
    queryFn: () => albumApi.list(familyId ?? ''),
    enabled: Boolean(familyId),
  });
}

export function useCreateAlbum(): UseMutationResult<
  { album: unknown },
  Error,
  CreateAlbumRequest
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => albumApi.create(payload.familyId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ALBUM_KEY });
    },
  });
}

export function useAlbumPhotos(
  albumId: string | undefined
): UseQueryResult<PhotoListResponse, Error> {
  return useQuery({
    queryKey: [...ALBUM_KEY, albumId, 'photos'],
    queryFn: () => albumApi.listPhotos(albumId ?? ''),
    enabled: Boolean(albumId),
  });
}

export function useAddPhoto(): UseMutationResult<
  { photo: unknown },
  Error,
  { albumId: string; payload: AddPhotoRequest }
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ albumId, payload }) => albumApi.addPhoto(albumId, payload),
    onSuccess: (_data, { albumId }) => {
      queryClient.invalidateQueries({ queryKey: ALBUM_KEY });
      queryClient.invalidateQueries({
        queryKey: [...ALBUM_KEY, albumId, 'photos'],
      });
    },
  });
}