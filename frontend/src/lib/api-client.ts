import apiClient from './api';
import type {
  AuthResponse,
  LoginRequest,
  RefreshTokenRequest,
  RegisterRequest,
  User,
  UserSearchResult,
} from '@/types/user';
import type {
  CreateFamilyRequest,
  CreateGenerationRequest,
  CreateHeritageRequest,
  CreateInvitationRequest,
  CreateMemberRequest,
  CreateRelationshipRequest,
  FamilyDetail,
  FamilyListResponse,
  FamilyResponse,
  FamilyTreeResponse,
  FamilyWithRole,
  GenerationResponse,
  GenerationsListResponse,
  HeritageResponse,
  HeritagesListResponse,
  InvitationDetail,
  InvitationListResponse,
  InvitationResponseWrapper,
  JoinFamilyRequest,
  JoinFamilyResponse,
  MemberResponse,
  MembersListResponse,
  MemberWithRelationships,
  Relationship,
  RelationshipResponse,
  UpdateFamilyRequest,
  UpdateMemberRequest,
  UpdateRelationshipRequest,
} from '@/types/family';
import type { MessageResponse } from '@/types/api';
import type {
  CreateTimeCapsuleRequest,
  OpenTimeCapsuleResponse,
  TimeCapsuleListResponse,
  TimeCapsuleEntry,
} from '@/types/time-capsule';
import type {
  CreateEventRequest,
  CreateEventResponse,
  EventEntry,
  EventListResponse,
  EventPhotoListResponse,
  EventPhotoRequest,
  RsvpRequest,
  UpdateEventRequest,
} from '@/types/event';
import type {
  AddPhotoRequest,
  CreateAlbumRequest,
  PhotoAlbumListResponse,
  PhotoListResponse,
} from '@/types/photo-album';
import type {
  ChatListResponse,
  ChatMessageListResponse,
  CreateChatRequest,
  SendMessageRequest,
  SendMessageResponse,
} from '@/types/chat';
import type {
  NotificationListResponse,
  NotificationMarkAllReadResponse,
  NotificationMarkReadResponse,
} from '@/types/notification';
import type {
  CreateCommentRequest,
  CreateOriginRequest,
  CreateRecipeRequest,
  PaginatedRecipes,
  PublicRecipeFilters,
  ReactionCounts,
  ReactionType,
  RecipeDetail,
  RecipeFilters,
  RecipeGenealogyTree,
  RecipeOrigin,
  RecipeThreadComment,
  UpdateCommentRequest,
  UpdateRecipeRequest,
} from '@/types/recipe';
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

// ---------------- Auth ----------------
export const authApi = {
  login: (payload: LoginRequest): Promise<AuthResponse> =>
    apiClient.post<AuthResponse>('/auth/login', payload).then((r) => r.data),
  register: (payload: RegisterRequest): Promise<AuthResponse> =>
    apiClient.post<AuthResponse>('/auth/register', payload).then((r) => r.data),
  refresh: (payload: RefreshTokenRequest): Promise<AuthResponse> =>
    apiClient.post<AuthResponse>('/auth/refresh', payload).then((r) => r.data),
  logout: (refreshToken?: string): Promise<MessageResponse> =>
    apiClient
      .post<MessageResponse>('/auth/logout', refreshToken ? { refreshToken } : {})
      .then((r) => r.data),
  me: (): Promise<User> =>
    apiClient.get<User>('/auth/me').then((r) => r.data),
};

// ---------------- Users ----------------
export const userApi = {
  getById: (id: string): Promise<User> =>
    apiClient.get<User>(`/users/${id}`).then((r) => r.data),
  updateMe: (payload: Partial<User>): Promise<User> =>
    apiClient.put<User>('/users/me', payload).then((r) => r.data),
  search: (query: string): Promise<UserSearchResult[]> =>
    apiClient
      .get<UserSearchResult[]>('/users/search', { params: { q: query } })
      .then((r) => r.data),
  update: (id: string, payload: Partial<User>): Promise<User> =>
    apiClient.put<User>(`/users/${id}`, payload).then((r) => r.data),
};

// ---------------- Families ----------------
export const familyApi = {
  list: (): Promise<FamilyListResponse> =>
    apiClient.get<FamilyListResponse>('/families').then((r) => r.data),
  listFamilies: (): Promise<FamilyWithRole[]> =>
    apiClient
      .get<FamilyListResponse>('/families')
      .then((r) => r.data.families ?? []),
  get: (id: string): Promise<FamilyDetail> =>
    apiClient.get<FamilyDetail>(`/families/${id}`).then((r) => r.data),
  create: (payload: CreateFamilyRequest): Promise<FamilyResponse> =>
    apiClient.post<FamilyResponse>('/families', payload).then((r) => r.data),
  update: (
    id: string,
    payload: UpdateFamilyRequest
  ): Promise<FamilyResponse> =>
    apiClient
      .put<FamilyResponse>(`/families/${id}`, payload)
      .then((r) => r.data),
  join: (payload: JoinFamilyRequest): Promise<JoinFamilyResponse> =>
    apiClient
      .post<JoinFamilyResponse>('/families/join', payload)
      .then((r) => r.data),
  getTree: (id: string): Promise<FamilyTreeResponse> =>
    apiClient
      .get<FamilyTreeResponse>(`/families/${id}/tree`)
      .then((r) => r.data),
  members: (familyId: string): Promise<MembersListResponse> =>
    apiClient
      .get<MembersListResponse>(`/families/${familyId}/members`)
      .then((r) => r.data),
  relationships: (familyId: string): Promise<Relationship[]> =>
    apiClient
      .get<Relationship[]>(`/relationships?familyId=${familyId}`)
      .then((r) => (Array.isArray(r.data) ? r.data : [])),
};

// ---------------- Members ----------------
export const memberApi = {
  list: (
    familyId: string,
    params?: {
      generationId?: string;
      search?: string;
      aliveOnly?: boolean;
    }
  ): Promise<MembersListResponse> =>
    apiClient
      .get<MembersListResponse>(`/families/${familyId}/members`, { params })
      .then((r) => r.data),
  get: (id: string): Promise<MemberWithRelationships> =>
    apiClient
      .get<MemberWithRelationships>(`/members/${id}`)
      .then((r) => r.data),
  create: (
    familyId: string,
    payload: CreateMemberRequest
  ): Promise<MemberResponse> =>
    apiClient
      .post<MemberResponse>(`/families/${familyId}/members`, payload)
      .then((r) => r.data),
  update: (
    id: string,
    payload: UpdateMemberRequest
  ): Promise<MemberResponse> =>
    apiClient
      .put<MemberResponse>(`/members/${id}`, payload)
      .then((r) => r.data),
  delete: (id: string): Promise<MessageResponse> =>
    apiClient.delete<MessageResponse>(`/members/${id}`).then((r) => r.data),
  createInvitation: (
    familyId: string,
    payload: CreateInvitationRequest
  ): Promise<InvitationResponseWrapper> =>
    apiClient
      .post<InvitationResponseWrapper>(
        `/families/${familyId}/invitations`,
        payload
      )
      .then((r) => r.data),
  listInvitations: (
    familyId: string
  ): Promise<InvitationListResponse> =>
    apiClient
      .get<InvitationListResponse>(`/families/${familyId}/invitations`)
      .then((r) => r.data),
  revokeInvitation: (invitationId: string): Promise<MessageResponse> =>
    apiClient
      .delete<MessageResponse>(`/invitations/${invitationId}`)
      .then((r) => r.data),
};

// ---------------- Generations ----------------
export const generationApi = {
  list: (familyId: string): Promise<GenerationsListResponse> =>
    apiClient
      .get<GenerationsListResponse>(`/families/${familyId}/generations`)
      .then((r) => r.data),
  create: (
    familyId: string,
    payload: CreateGenerationRequest
  ): Promise<GenerationResponse> =>
    apiClient
      .post<GenerationResponse>(
        `/families/${familyId}/generations`,
        payload
      )
      .then((r) => r.data),
  delete: (id: string): Promise<MessageResponse> =>
    apiClient
      .delete<MessageResponse>(`/generations/${id}`)
      .then((r) => r.data),
};

// ---------------- Relationships ----------------
export const relationshipApi = {
  create: (
    payload: CreateRelationshipRequest
  ): Promise<RelationshipResponse> =>
    apiClient
      .post<RelationshipResponse>('/relationships', payload)
      .then((r) => r.data),
  update: (
    id: string,
    payload: UpdateRelationshipRequest
  ): Promise<RelationshipResponse> =>
    apiClient
      .put<RelationshipResponse>(`/relationships/${id}`, payload)
      .then((r) => r.data),
  delete: (id: string): Promise<MessageResponse> =>
    apiClient
      .delete<MessageResponse>(`/relationships/${id}`)
      .then((r) => r.data),
};

// ---------------- Heritages ----------------
export const heritageApi = {
  list: (familyId: string): Promise<HeritagesListResponse> =>
    apiClient
      .get<HeritagesListResponse>(`/families/${familyId}/heritages`)
      .then((r) => r.data),
  create: (
    familyId: string,
    payload: CreateHeritageRequest
  ): Promise<HeritageResponse> =>
    apiClient
      .post<HeritageResponse>(`/families/${familyId}/heritages`, payload)
      .then((r) => r.data),
};

// ---------------- Time Capsules ----------------
export interface ListTimeCapsulesParams {
  status?: 'sealed' | 'available' | 'opened';
  recipientId?: string;
}

export const timeCapsuleApi = {
  list: (
    familyId: string,
    params?: ListTimeCapsulesParams
  ): Promise<TimeCapsuleListResponse> =>
    apiClient
      .get<TimeCapsuleListResponse>(`/families/${familyId}/time-capsules`, {
        params,
      })
      .then((r) => r.data),
  get: (id: string): Promise<TimeCapsuleEntry | null> =>
    apiClient
      .get<{ capsule: TimeCapsuleEntry['capsule'] }>(`/time-capsules/${id}`)
      .then((r) =>
        r.data ? ({ capsule: r.data.capsule } as TimeCapsuleEntry) : null
      )
      .catch(() => null),
  create: (
    familyId: string,
    payload: CreateTimeCapsuleRequest
  ): Promise<{ capsule: TimeCapsuleEntry['capsule']; daysUntilUnlock: number }> =>
    apiClient
      .post(`/families/${familyId}/time-capsules`, payload)
      .then((r) => r.data),
  open: (id: string): Promise<OpenTimeCapsuleResponse> =>
    apiClient
      .post<OpenTimeCapsuleResponse>(`/time-capsules/${id}/open`)
      .then((r) => r.data),
  delete: (id: string): Promise<MessageResponse> =>
    apiClient
      .delete<MessageResponse>(`/time-capsules/${id}`)
      .then((r) => r.data),
};

// ---------------- Events ----------------
export interface ListEventsParams {
  type?: string;
  upcoming?: boolean;
  past?: boolean;
  page?: number;
  size?: number;
}

export const eventApi = {
  list: (
    familyId: string,
    params?: ListEventsParams
  ): Promise<EventListResponse> =>
    apiClient
      .get<EventListResponse>(`/families/${familyId}/events`, { params })
      .then((r) => r.data),
  get: (id: string): Promise<EventEntry | null> =>
    apiClient
      .get<{ event: EventEntry['event'] }>(`/events/${id}`)
      .then((r) => (r.data ? ({ event: r.data.event } as EventEntry) : null))
      .catch(() => null),
  create: (
    familyId: string,
    payload: CreateEventRequest
  ): Promise<CreateEventResponse> =>
    apiClient
      .post<CreateEventResponse>(`/families/${familyId}/events`, payload)
      .then((r) => r.data),
  update: (
    id: string,
    payload: UpdateEventRequest
  ): Promise<{ event: EventEntry['event'] }> =>
    apiClient.put(`/events/${id}`, payload).then((r) => r.data),
  delete: (id: string): Promise<MessageResponse> =>
    apiClient.delete<MessageResponse>(`/events/${id}`).then((r) => r.data),
  rsvp: (id: string, payload: RsvpRequest): Promise<{ attendee: unknown }> =>
    apiClient.post(`/events/${id}/rsvp`, payload).then((r) => r.data),
  listPhotos: (id: string): Promise<EventPhotoListResponse> =>
    apiClient
      .get<EventPhotoListResponse>(`/events/${id}/photos`)
      .then((r) => r.data),
  addPhoto: (
    id: string,
    payload: EventPhotoRequest
  ): Promise<{ photo: unknown }> =>
    apiClient.post(`/events/${id}/photos`, payload).then((r) => r.data),
};

// ---------------- Photo Albums ----------------
export const albumApi = {
  list: (familyId: string): Promise<PhotoAlbumListResponse> =>
    apiClient
      .get<PhotoAlbumListResponse>(`/families/${familyId}/albums`)
      .then((r) => r.data),
  create: (
    familyId: string,
    payload: CreateAlbumRequest
  ): Promise<{ album: unknown }> =>
    apiClient.post(`/families/${familyId}/albums`, payload).then((r) => r.data),
  listPhotos: (albumId: string): Promise<PhotoListResponse> =>
    apiClient
      .get<PhotoListResponse>(`/albums/${albumId}/photos`)
      .then((r) => r.data),
  addPhoto: (
    albumId: string,
    payload: AddPhotoRequest
  ): Promise<{ photo: unknown }> =>
    apiClient.post(`/albums/${albumId}/photos`, payload).then((r) => r.data),
};

// ---------------- Chat ----------------
export const chatApi = {
  list: (familyId: string): Promise<ChatListResponse> =>
    apiClient
      .get<ChatListResponse>(`/families/${familyId}/chats`)
      .then((r) => r.data),
  create: (
    familyId: string,
    payload: Omit<CreateChatRequest, 'familyId'>
  ): Promise<{ chat: unknown }> =>
    apiClient.post(`/families/${familyId}/chats`, payload).then((r) => r.data),
  listMessages: (
    chatId: string,
    params?: { before?: string; limit?: number }
  ): Promise<ChatMessageListResponse> =>
    apiClient
      .get<ChatMessageListResponse>(`/chats/${chatId}/messages`, { params })
      .then((r) => r.data),
  sendMessage: (
    chatId: string,
    payload: SendMessageRequest
  ): Promise<SendMessageResponse> =>
    apiClient
      .post<SendMessageResponse>(`/chats/${chatId}/messages`, payload)
      .then((r) => r.data),
};

// ---------------- Notifications ----------------
export interface ListNotificationsParams {
  unreadOnly?: boolean;
  page?: number;
  size?: number;
}

export const notificationApi = {
  list: (
    params?: ListNotificationsParams
  ): Promise<NotificationListResponse> =>
    apiClient
      .get<NotificationListResponse>('/notifications', { params })
      .then((r): NotificationListResponse => {
        const fallback: NotificationListResponse = {
          notifications: [],
          total: 0,
          unreadCount: 0,
          page: 0,
          size: 0,
        };
        if (!r.data) return fallback;
        return {
          ...fallback,
          ...r.data,
          notifications: Array.isArray(r.data.notifications)
            ? r.data.notifications
            : [],
        };
      }),
  markRead: (id: string): Promise<NotificationMarkReadResponse> =>
    apiClient
      .post<NotificationMarkReadResponse>(`/notifications/${id}/read`)
      .then((r) => r.data),
  markAllRead: (): Promise<NotificationMarkAllReadResponse> =>
    apiClient
      .post<NotificationMarkAllReadResponse>('/notifications/read-all')
      .then((r) => r.data),
};

// ---------------- Recipes ----------------
export const recipeApi = {
  /** List recipes of a family (filterable). */
  listFamily: (
    familyId: string,
    filters?: RecipeFilters
  ): Promise<PaginatedRecipes> =>
    apiClient
      .get<PaginatedRecipes>(`/families/${familyId}/recipes`, { params: filters })
      .then((r) => r.data),

  /** Global public recipe search. */
  searchPublic: (filters?: PublicRecipeFilters): Promise<PaginatedRecipes> =>
    apiClient
      .get<PaginatedRecipes>('/recipes/public', { params: filters })
      .then((r) => r.data),

  /** Recipe detail: author + ingredients + steps + origins + comments + reactions. */
  get: (id: string): Promise<RecipeDetail> =>
    apiClient.get<RecipeDetail>(`/recipes/${id}`).then((r) => r.data),

  /** Create a recipe in a family. */
  create: (
    familyId: string,
    payload: CreateRecipeRequest
  ): Promise<RecipeDetail> =>
    apiClient
      .post<RecipeDetail>(`/families/${familyId}/recipes`, payload)
      .then((r) => r.data),

  /** Update a recipe (replaces nested collections when present). */
  update: (id: string, payload: UpdateRecipeRequest): Promise<RecipeDetail> =>
    apiClient
      .put<RecipeDetail>(`/recipes/${id}`, payload)
      .then((r) => r.data),

  /** Delete a recipe. */
  delete: (id: string): Promise<MessageResponse> =>
    apiClient
      .delete<MessageResponse>(`/recipes/${id}`)
      .then((r) => r.data),

  // ---- Origins / Genealogy ----
  /** Add a single origin edge (transmission event). */
  addOrigin: (
    recipeId: string,
    payload: CreateOriginRequest
  ): Promise<RecipeOrigin> =>
    apiClient
      .post<RecipeOrigin>(`/recipes/${recipeId}/origins`, payload)
      .then((r) => r.data),

  /** Flat list of origins for a recipe. */
  listOrigins: (recipeId: string): Promise<RecipeOrigin[]> =>
    apiClient
      .get<RecipeOrigin[]>(`/recipes/${recipeId}/origins`)
      .then((r) => (Array.isArray(r.data) ? r.data : [])),

  /** Full nested genealogy tree - the showcase feature. */
  genealogyTree: (recipeId: string): Promise<RecipeGenealogyTree> =>
    apiClient
      .get<RecipeGenealogyTree>(`/recipes/${recipeId}/genealogy-tree`)
      .then((r) => r.data),

  // ---- Reactions ----
  /** Add or update current user's reaction. */
  react: (recipeId: string, reactionType: ReactionType): Promise<ReactionCounts> =>
    apiClient
      .post<ReactionCounts>(`/recipes/${recipeId}/reactions`, { reactionType })
      .then((r) => r.data),

  /** Remove current user's reaction. */
  removeReaction: (recipeId: string): Promise<MessageResponse> =>
    apiClient
      .delete<MessageResponse>(`/recipes/${recipeId}/reactions`)
      .then((r) => r.data),

  /** Get reaction counts + the per-user breakdown. */
  reactions: (recipeId: string): Promise<ReactionCounts> =>
    apiClient
      .get<ReactionCounts>(`/recipes/${recipeId}/reactions`)
      .then((r) => r.data),

  // ---- Comments ----
  /** Add a comment or reply. */
  addComment: (
    recipeId: string,
    payload: CreateCommentRequest
  ): Promise<RecipeThreadComment> =>
    apiClient
      .post<RecipeThreadComment>(`/recipes/${recipeId}/comments`, payload)
      .then((r) => r.data),

  /** List threaded comments. */
  comments: (recipeId: string): Promise<RecipeThreadComment[]> =>
    apiClient
      .get<RecipeThreadComment[]>(`/recipes/${recipeId}/comments`)
      .then((r) => (Array.isArray(r.data) ? r.data : [])),

  /** Update a comment. */
  updateComment: (
    commentId: string,
    payload: UpdateCommentRequest
  ): Promise<RecipeThreadComment> =>
    apiClient
      .put<RecipeThreadComment>(`/comments/${commentId}`, payload)
      .then((r) => r.data),

  /** Delete a comment. */
  deleteComment: (commentId: string): Promise<MessageResponse> =>
    apiClient
      .delete<MessageResponse>(`/comments/${commentId}`)
      .then((r) => r.data),
};

// ---------------- Stories ----------------
export const storyApi = {
  /** List stories of a family. */
  list: (
    familyId: string,
    filters?: StoryListFilters
  ): Promise<PaginatedStories> =>
    apiClient
      .get<PaginatedStories>(`/families/${familyId}/stories`, { params: filters })
      .then((r) => r.data),

  /** Get story detail (story + author + media + tags + comments). */
  get: (id: string): Promise<StoryDetail> =>
    apiClient.get<StoryDetail>(`/stories/${id}`).then((r) => r.data),

  /** Create a story in a family. */
  create: (
    familyId: string,
    payload: CreateStoryRequest
  ): Promise<StoryDetail> =>
    apiClient
      .post<StoryDetail>(`/families/${familyId}/stories`, payload)
      .then((r) => r.data),

  /** Update a story. */
  update: (
    id: string,
    payload: UpdateStoryRequest
  ): Promise<{ story: Story }> =>
    apiClient
      .put<{ story: Story }>(`/stories/${id}`, payload)
      .then((r) => r.data),

  /** Delete a story. */
  delete: (id: string): Promise<MessageResponse> =>
    apiClient
      .delete<MessageResponse>(`/stories/${id}`)
      .then((r) => r.data),

  // ---- Tags ----
  /** List every story tag with a story count. */
  listTags: (): Promise<StoryTagListItem[]> =>
    apiClient
      .get<{ tags: StoryTagListItem[] } | StoryTagListItem[]>('/story-tags')
      .then((r) =>
        Array.isArray(r.data) ? r.data : r.data.tags ?? []
      ),

  /** Create a new tag. */
  createTag: (
    payload: CreateStoryTagRequest
  ): Promise<{ tag: StoryTag }> =>
    apiClient
      .post<{ tag: StoryTag }>('/story-tags', payload)
      .then((r) => r.data),
};

// Backwards-compatible default export – useful when callers prefer
// `import api from '@/lib/api-client'`.
const api = apiClient;

export default api;
