import type { FamilyMember } from './family';

/**
 * Status of a time capsule as returned by the backend.
 * - `sealed`: still locked, not yet openable
 * - `available`: unlock conditions met, ready to be opened
 * - `opened`: already opened by an authorized user
 */
export type TimeCapsuleStatus = 'sealed' | 'available' | 'opened';

export interface TimeCapsule {
  id: string;
  familyId: string;
  creatorId: string;
  title: string;
  content?: string;
  mediaUrl?: string;
  recipientMemberId?: string;
  unlockDate?: string;
  unlockCondition?: 'DATE' | 'EVENT' | 'MANUAL';
  unlockEvent?: string;
  isOpened?: boolean;
  openedAt?: string;
  openedBy?: string;
  createdAt?: string;
}

/** Wrapper for a single capsule returned alongside metadata. */
export interface TimeCapsuleEntry {
  capsule: TimeCapsule;
  creator?: { id?: string; fullName?: string };
  recipient?: { id?: string; fullName?: string } | null;
  daysUntilUnlock?: number;
  isUnlockable?: boolean;
}

export interface TimeCapsuleListResponse {
  capsules: TimeCapsuleEntry[];
}

export interface OpenTimeCapsuleResponse {
  capsule: TimeCapsule;
  content?: string;
}

export interface CreateTimeCapsuleRequest {
  familyId: string;
  title: string;
  content?: string;
  mediaUrl?: string;
  recipientMemberId?: string;
  /** ISO date (YYYY-MM-DD). Must be in the future. */
  unlockDate: string;
  unlockCondition: 'DATE' | 'EVENT' | 'MANUAL';
  unlockEvent?: string;
}

export interface CountdownInfo {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isUnlocked: boolean;
  totalMs: number;
}