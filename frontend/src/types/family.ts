export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'male' | 'female' | 'other';

export interface Family {
  id: string;
  name: string;
  description?: string;
  foundedYear?: number;
  motto?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  originLocation?: string;
  memberCount?: number;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  /** Convenience fields for legacy callers */
  slug?: string;
  origin?: string;
  founderName?: string;
  ownerId?: string;
  owner?: User;
}

export interface FamilyWithRole {
  family: Family;
  role: string;
  memberCount: number;
  isCreator?: boolean;
}

export interface FamilyListResponse {
  families: FamilyWithRole[];
}

export interface FamilyMember {
  id: string;
  familyId: string;
  fullName: string;
  nickname?: string;
  gender?: Gender;
  avatarUrl?: string;
  birthDate?: string;
  deathDate?: string;
  birthPlace?: string;
  currentLocation?: string;
  occupation?: string;
  biography?: string;
  generationId?: string;
  generationNumber?: number;
  generationName?: string;
  isAlive?: boolean;
  age?: number;
  userId?: string;
  createdAt?: string;
  updatedAt?: string;
  /** Convenience for legacy callers */
  dateOfBirth?: string;
  dateOfDeath?: string;
  bio?: string;
  generation?: number;
  isLiving?: boolean;
  user?: User;
}

export interface MemberSummary {
  id: string;
  fullName: string;
  nickname?: string;
  gender?: Gender;
  birthDate?: string;
  deathDate?: string;
  isAlive?: boolean;
  generationId?: string;
  generationNumber?: number;
  avatarUrl?: string;
}

export interface MemberWithRelationships {
  member: FamilyMember;
  generation?: MemberSummary;
  parents: MemberSummary[];
  children: MemberSummary[];
  spouses: MemberSummary[];
  siblings: MemberSummary[];
}

export interface MembersListResponse {
  members: MemberWithRelationships[];
}

export interface MemberResponse {
  member: FamilyMember;
}

export type RelationshipType =
  | 'PARENT'
  | 'CHILD'
  | 'SPOUSE'
  | 'SIBLING'
  | 'ADOPTED'
  | 'GODPARENT'
  | 'parent'
  | 'child'
  | 'spouse'
  | 'sibling'
  | 'adopted';

export interface Relationship {
  id: string;
  familyId: string;
  fromMemberId: string;
  fromMemberName?: string;
  toMemberId: string;
  toMemberName?: string;
  type: RelationshipType;
  startDate?: string;
  endDate?: string;
  notes?: string;
  createdAt?: string;
}

export interface RelationshipResponse {
  relationship: Relationship;
}

export interface Generation {
  id: string;
  familyId: string;
  generationNumber: number;
  name?: string;
  startYear?: number;
  endYear?: number;
  description?: string;
  memberCount?: number;
  createdAt?: string;
}

export interface GenerationResponse {
  generation: Generation;
}

export interface GenerationsListResponse {
  generations: Generation[];
}

export interface Heritage {
  id: string;
  familyId: string;
  heritageType: string;
  title: string;
  description?: string;
  mediaUrl?: string;
  yearEstablished?: number;
  createdBy?: string;
  createdAt?: string;
}

export interface HeritageResponse {
  heritage: Heritage;
}

export interface HeritagesListResponse {
  heritages: Heritage[];
}

export interface FamilyStats {
  memberCount: number;
  recipeCount?: number;
  storyCount?: number;
  eventCount?: number;
  generationCount?: number;
  livingMembers?: number;
}

export interface FamilyDetail {
  family: Family;
  role: string;
  generations: Generation[];
  heritages: Heritage[];
  stats: FamilyStats;
}

export interface JoinFamilyRequest {
  inviteCode: string;
}

export interface JoinFamilyResponse {
  family: Family;
  role: string;
  memberCount: number;
}

export interface FamilyResponse {
  family: Family;
}

export interface CreateFamilyRequest {
  name: string;
  description?: string;
  foundedYear?: number;
  motto?: string;
  originLocation?: string;
}

export interface UpdateFamilyRequest extends Partial<CreateFamilyRequest> {}

export interface CreateMemberRequest {
  fullName: string;
  nickname?: string;
  gender?: Gender;
  birthDate?: string;
  deathDate?: string;
  birthPlace?: string;
  currentLocation?: string;
  occupation?: string;
  biography?: string;
  generationId?: string;
  isAlive?: boolean;
}

export interface UpdateMemberRequest extends Partial<CreateMemberRequest> {
  avatarUrl?: string;
  userId?: string;
}

export interface CreateRelationshipRequest {
  familyId: string;
  fromMemberId: string;
  toMemberId: string;
  relationshipType: RelationshipType;
  startDate?: string;
  notes?: string;
}

export interface UpdateRelationshipRequest extends Partial<CreateRelationshipRequest> {}

export interface CreateGenerationRequest {
  generationNumber: number;
  name?: string;
  startYear?: number;
  endYear?: number;
  description?: string;
}

export interface CreateHeritageRequest {
  heritageType: string;
  title: string;
  description?: string;
  mediaUrl?: string;
  yearEstablished?: number;
}

export interface CreateInvitationRequest {
  inviteeEmail: string;
  role: string;
}

export interface InvitationResponse {
  inviteCode: string;
  inviteUrl: string;
  expiresAt: string;
}

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';

export interface InvitationDetail {
  id: string;
  familyId: string;
  inviterId: string;
  inviterName?: string;
  inviteeEmail: string;
  inviteeName?: string | null;
  inviteCode: string;
  inviteUrl: string;
  role?: string;
  status: InvitationStatus;
  expiresAt?: string;
  acceptedAt?: string | null;
  createdAt?: string;
}

export interface InvitationListResponse {
  invitations: InvitationDetail[];
}

export interface InvitationResponseWrapper {
  invitation: InvitationResponse;
}

export interface MessageResponse {
  message: string;
}

export interface FamilyTreeResponse {
  familyId: string;
  familyName: string;
  totalMembers: number;
  totalGenerations: number;
  generations: FamilyTreeGeneration[];
}

export interface FamilyTreeGeneration {
  id: string;
  generationNumber: number;
  name?: string;
  startYear?: number;
  endYear?: number;
  members: TreeMemberNode[];
}

export interface TreeMemberNode {
  id: string;
  familyId: string;
  fullName: string;
  nickname?: string;
  gender?: Gender;
  avatarUrl?: string;
  birthDate?: string;
  deathDate?: string;
  isAlive?: boolean;
  occupation?: string;
  generationId?: string;
  spouses: TreeMemberNode[];
  siblings: TreeMemberNode[];
  children: TreeMemberNode[];
}

import type { User } from './user';
