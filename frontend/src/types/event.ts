import type { User } from './user';
import type { FamilyMember } from './family';

export type EventType =
  | 'WEDDING'
  | 'FUNERAL'
  | 'BIRTHDAY'
  | 'ANNIVERSARY'
  | 'REUNION'
  | 'HOLIDAY'   // legacy alias kept for backward-compat; prefer RELIGIOUS
  | 'RELIGIOUS'
  | 'OTHER';

export type RsvpStatus = 'GOING' | 'MAYBE' | 'NOT_GOING' | 'PENDING';

export interface EventAttendee {
  id?: string;
  eventId?: string;
  memberId?: string;
  rsvpStatus?: RsvpStatus;
  notes?: string;
  respondedAt?: string;
}

export interface FamilyEvent {
  id: string;
  familyId: string;
  creatorId: string;
  title: string;
  description?: string;
  eventType: EventType;
  eventDate: string;
  endDate?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  coverImageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type Event = FamilyEvent;

export interface EventEntry {
  event: FamilyEvent;
  creator?: { id?: string; fullName?: string; avatarUrl?: string } | null;
  attendeeCount?: number;
  goingCount?: number;
}

export interface EventListResponse {
  events: EventEntry[];
  total: number;
  page: number;
  size: number;
}

export interface CreateEventResponse {
  event: FamilyEvent;
  attendees?: EventAttendee[];
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  eventType?: EventType;
  eventDate?: string;
  endDate?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  coverImageUrl?: string;
}

export interface CreateEventRequest {
  familyId: string;
  title: string;
  description?: string;
  eventType: EventType;
  eventDate: string;
  endDate?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  coverImageUrl?: string;
  attendeeMemberIds?: string[];
}

export interface RsvpRequest {
  memberId: string;
  rsvpStatus: RsvpStatus;
  notes?: string;
}

export interface EventPhoto {
  id: string;
  eventId: string;
  photoUrl: string;
  caption?: string;
  uploadedBy?: string;
  uploadedAt?: string;
}

export interface EventPhotoEntry {
  photo: EventPhoto;
  uploader?: { id?: string; fullName?: string; avatarUrl?: string } | null;
}

export interface EventPhotoListResponse {
  photos: EventPhotoEntry[];
}

export interface EventPhotoRequest {
  photoUrl: string;
  caption?: string;
}