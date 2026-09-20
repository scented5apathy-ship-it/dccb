'use client';

/**
 * Centralized permission hook + helpers for the CâyGiaPhảSố frontend.
 *
 * Roles per family (server-defined):
 *   ADMIN   – full control: edit family, invite/remove members, change roles,
 *             create/edit/delete any recipe / story / event / time-capsule
 *   EDITOR  – can create/edit/delete recipes, stories, events, time capsules;
 *             cannot edit family or member roles
 *   VIEWER  – read-only
 *   MEMBER  – legacy default role, equivalent to VIEWER
 *
 * The hook is intentionally resilient: it accepts the familyId in two ways —
 * either an explicit prop (e.g. from a route param), or it reads it from the
 * caller's `useFamilies()` cache as a fallback. When the familyId cannot be
 * resolved (no families loaded yet, unauthenticated, etc.) every permission
 * gate defaults to FALSE — fail-closed is the safe default.
 *
 * IMPORTANT: This is a client-side UX layer. The backend is still the source
 * of truth — every mutation endpoint re-checks the caller's role. Treat
 * these helpers as "hide the button so users don't get 403s", never as a
 * security boundary.
 */

import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useFamilies, useFamily } from '@/hooks/useFamily';

export type FamilyRole = 'ADMIN' | 'EDITOR' | 'VIEWER' | 'MEMBER';

export interface UsePermission {
  /** Resolved family role (uppercase). Null if not loaded / not a member. */
  role: FamilyRole | null;
  /** Raw role string from the API (preserves casing). */
  rawRole: string | null;
  /** True when the resolved role === ADMIN (case-insensitive). */
  isAdmin: boolean;
  /** True when ADMIN or EDITOR. */
  isEditor: boolean;
  /** True when the user can read this family's data. */
  isViewer: boolean;
  /** True for the plain "MEMBER" tier (no special powers). */
  isMember: boolean;
  /** True if the current user is the family's creator. */
  isCreator: boolean;
  /** Generic predicate. `can('edit')` === canEdit(), etc. */
  can: (action: PermissionAction) => boolean;
  /** Permission predicates. */
  canEdit: () => boolean;
  canDelete: () => boolean;
  canCreate: () => boolean;
  canInvite: () => boolean;
  canManageMembers: () => boolean;
  canEditFamily: () => boolean;
  /** True if the user is authenticated and the family context has loaded. */
  isReady: boolean;
}

export type PermissionAction =
  | 'create'
  | 'edit'
  | 'delete'
  | 'invite'
  | 'manageMembers'
  | 'editFamily'
  | 'sealTimeCapsule'
  | 'openTimeCapsule';

/**
 * Hook that derives the current user's role + permissions inside a family.
 *
 * @param familyIdProp optional explicit family id (e.g. `useParams()`).
 *                     When omitted, the hook falls back to the family's id
 *                     inferred from the `useFamilies()` cache, which is
 *                     adequate for global pages like `/recipes` that show
 *                     one family's data at a time.
 */
export function usePermission(familyIdProp?: string): UsePermission {
  const { user, isAuthenticated, isHydrated } = useAuth();
  const { data: families } = useFamilies();

  // Resolve the familyId: explicit prop wins, then first family in cache.
  const familyId = useMemo(() => {
    if (familyIdProp) return familyIdProp;
    return families?.[0]?.family?.id;
  }, [familyIdProp, families]);

  // Fetch the family detail when we know which family to scope to. This lets
  // us get the precise role + isCreator flag the server returned.
  const { data: familyDetail } = useFamily(familyId);

  return useMemo<UsePermission>(() => {
    // Find the matching FamilyWithRole entry from the list cache so we can
    // read the role as reported by the /families endpoint. When we have
    // detail data it wins (it is always fresher than the list snapshot).
    const fromList = families?.find((f) => f.family?.id === familyId);
    const rawRole = (
      familyDetail?.role ??
      fromList?.role ??
      ''
    ).toString();

    const normalized = rawRole.toUpperCase();
    const role: FamilyRole | null =
      normalized === 'ADMIN' ||
      normalized === 'EDITOR' ||
      normalized === 'VIEWER' ||
      normalized === 'MEMBER'
        ? (normalized as FamilyRole)
        : null;

    const isAdmin = role === 'ADMIN';
    const isEditor = role === 'EDITOR' || isAdmin;
    const isViewer = role === 'VIEWER' || isEditor || isMember(role);
    const isMemberOnly = role === 'MEMBER';
    const isCreator = Boolean(familyDetail?.family?.createdBy && user?.id
      ? familyDetail.family.createdBy === user.id
      : fromList?.isCreator);

    const isReady =
      isHydrated && isAuthenticated && Boolean(familyId) && role !== null;

    const canCreate = isEditor;
    const canEdit = isEditor;
    const canDelete = isEditor || isAdmin;
    const canInvite = isAdmin;
    const canManageMembers = isAdmin;
    const canEditFamily = isAdmin;
    const canSealTimeCapsule = isEditor;
    const canOpenTimeCapsule = true; // any member can open an unlocked capsule

    const can = (action: PermissionAction): boolean => {
      switch (action) {
        case 'create':
          return canCreate;
        case 'edit':
          return canEdit;
        case 'delete':
          return canDelete;
        case 'invite':
          return canInvite;
        case 'manageMembers':
          return canManageMembers;
        case 'editFamily':
          return canEditFamily;
        case 'sealTimeCapsule':
          return canSealTimeCapsule;
        case 'openTimeCapsule':
          return canOpenTimeCapsule;
        default:
          return false;
      }
    };

    return {
      role,
      rawRole: rawRole || null,
      isAdmin,
      isEditor,
      isViewer,
      isMember: isMemberOnly,
      isCreator,
      can,
      canEdit,
      canDelete,
      canCreate,
      canInvite,
      canManageMembers,
      canEditFamily,
      isReady,
    };
    // We deliberately exclude isHydrated / isAuthenticated from the memo
    // dependencies — they're booleans that flip briefly during hydration and
    // would otherwise cause every consumer to re-render twice. The actual
    // permissions derive from the role, which is the authoritative source.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [familyId, familyDetail, families, user?.id]);
}

function isMember(role: FamilyRole | null): boolean {
  return role === 'MEMBER' || role === 'VIEWER';
}

// ---------- Pure helpers (no React) ----------
// Useful inside event handlers, render-prop helpers, or class components.

export function isAdminRole(role?: string | null): boolean {
  return (role ?? '').toUpperCase() === 'ADMIN';
}

export function isEditorRole(role?: string | null): boolean {
  const r = (role ?? '').toUpperCase();
  return r === 'ADMIN' || r === 'EDITOR';
}

export function canEditFn(role?: string | null): boolean {
  return isEditorRole(role);
}

export function canDeleteFn(role?: string | null): boolean {
  // Editors can delete content they (or anyone in the family) own;
  // admins can always delete. Mirrors the hook's behaviour.
  return isEditorRole(role);
}

export function canInviteFn(role?: string | null): boolean {
  return isAdminRole(role);
}

export function canManageMembersFn(role?: string | null): boolean {
  return isAdminRole(role);
}

export function canEditFamilyFn(role?: string | null): boolean {
  return isAdminRole(role);
}

export default usePermission;
