/**
 * Server-side auth helpers
 *
 * This file contains server-side authentication helpers that require
 * access to getUserProfile() from the server module.
 *
 * For client-safe permission checking, use ./permissions.ts directly.
 */

import { getUserProfile, createClient } from './server'
import type { UserRole, Permission, Profile } from './types'
import {
  hasPermission as _hasPermission,
  hasAnyPermission as _hasAnyPermission,
} from './permissions'

// Re-export getUserProfile for convenience
export { getUserProfile }

// Re-export all client-safe functions for backward compatibility
export {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isAdmin,
  isManagement,
  canEdit,
  canAccess,
  hasRole,
} from './permissions'

// =============================================================================
// Server-side functions (require getUserProfile)
// =============================================================================

/**
 * Server-side: Require a specific permission, throws if not met
 */
export async function requirePermission(
  permission: Permission
): Promise<Profile> {
  const profile = await getUserProfile()

  if (!profile) {
    throw new Error('Profile not found')
  }

  if (!_hasPermission(profile.role, permission)) {
    throw new Error('Insufficient permissions')
  }

  return profile
}

/**
 * Server-side: Require any of the specified permissions
 */
export async function requireAnyPermission(
  permissions: Permission[]
): Promise<Profile> {
  const profile = await getUserProfile()

  if (!profile) {
    throw new Error('Profile not found')
  }

  if (!_hasAnyPermission(profile.role, permissions)) {
    throw new Error('Insufficient permissions')
  }

  return profile
}

/**
 * @deprecated Use requirePermission() instead
 */
export async function requireRole(requiredRole: UserRole): Promise<Profile> {
  const profile = await getUserProfile()

  if (!profile) {
    throw new Error('Profile not found')
  }

  // Map old role requirements to new system
  const roleMap: Record<string, Permission> = {
    ADMIN: 'admin:access',
    VORSTAND: 'mitglieder:write',
    MITGLIED_AKTIV: 'veranstaltungen:register',
  }

  const permission = roleMap[requiredRole]
  if (permission && !_hasPermission(profile.role, permission)) {
    throw new Error('Insufficient permissions')
  }

  return profile
}

/**
 * Get the person ID for the currently logged-in user
 * Returns null if not logged in or no person record exists
 */
export async function getCurrentPersonId(): Promise<string | null> {
  const profile = await getUserProfile()

  if (!profile) {
    return null
  }

  const supabase = await createClient()

  const { data: person } = await supabase
    .from('personen')
    .select('id')
    .eq('email', profile.email)
    .single()

  return person?.id || null
}
