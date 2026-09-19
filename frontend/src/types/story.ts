/** Story-related types. Mirrors the backend entity and StoryService payloads. */

export type StoryMediaType = 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT' | 'image' | 'video' | 'audio' | 'document';

export interface StoryMedia {
  id: string;
  storyId?: string;
  mediaType?: StoryMediaType;
  type?: StoryMediaType;
  mediaUrl?: string;
  url?: string;
  caption?: string;
  orderIndex?: number;
}

export interface StoryTag {
  id: string;
  name: string;
  createdAt?: string;
  color?: string;
}

export interface Story {
  id: string;
  familyId: string;
  authorId: string;
  title: string;
  content: string;
  storyDate?: string;
  storyLocation?: string;
  relatedMemberIds?: string[];
  relatedGenerationId?: string;
  isFeatured?: boolean;
  viewCount?: number;
  createdAt?: string;
  updatedAt?: string;
  excerpt?: string;
  coverImageUrl?: string;
  media?: StoryMedia[];
  tags?: StoryTag[];
  authorName?: string;
}

/** Single item returned by the list endpoint - includes nested story + author + tags. */
export interface StoryListItem {
  story: Story;
  author?: {
    id: string;
    fullName?: string;
    avatarUrl?: string;
  } | null;
  mediaCount?: number;
  tags?: string[];
}

export interface PaginatedStories {
  stories: StoryListItem[];
  total: number;
  page: number;
  size: number;
}

export interface StoryDetail {
  story: Story;
  author?: {
    id: string;
    fullName?: string;
    avatarUrl?: string;
  } | null;
  media: StoryMedia[];
  tags: StoryTag[];
  comments: StoryComment[];
}

export interface StoryComment {
  id: string;
  content: string;
  createdAt?: string;
  userId?: string;
  userName?: string;
  userAvatar?: string;
}

export interface StoryListFilters {
  search?: string;
  tag?: string;
  featured?: boolean;
  memberId?: string;
  page?: number;
  size?: number;
}

export interface CreateStoryRequest {
  title: string;
  content: string;
  storyDate?: string;
  storyLocation?: string;
  relatedMemberIds?: string[];
  relatedGenerationId?: string;
  isFeatured?: boolean;
  media?: { mediaType: string; mediaUrl: string; caption?: string }[];
  tagIds?: string[];
}

export interface UpdateStoryRequest {
  title?: string;
  content?: string;
  storyDate?: string;
  storyLocation?: string;
  relatedMemberIds?: string[];
  relatedGenerationId?: string;
  isFeatured?: boolean;
}

export interface CreateStoryTagRequest {
  name: string;
}

export interface StoryTagListItem {
  tag: StoryTag;
  storyCount: number;
}