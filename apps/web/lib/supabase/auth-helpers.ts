import { getUserProfile } from './server'
import type { UserRole, Profile } from './types'

/**
 * Role hierarchy: ADMIN > EDITOR > VIEWER
 * Higher roles have access to lower role permissions
 */
const roleHierarchy: UserRole[] = ['ADMIN', 'EDITOR', 'VIEWER']

/**
 * Check if user has required role (or higher)
 */
export async function requireRole(requiredRole: UserRole): Promise<Profile> {
  const profile = await getUserProfile()

  if (!profile) {
    throw new Error('Profile not found')
  }

  const requiredIndex = roleHierarchy.indexOf(requiredRole)
  const currentIndex = roleHierarchy.indexOf(profile.role)

  // Lower index = higher role (ADMIN=0, EDITOR=1, VIEWER=2)
  if (currentIndex > requiredIndex) {
    throw new Error('Insufficient permissions')
  }

  return profile
}

/**
 * Check if user can access a specific route based on role
 */
export function canAccess(route: string, userRole: UserRole): boolean {
  const accessMap: Record<string, UserRole[]> = {
    '/dashboard': ['ADMIN', 'EDITOR', 'VIEWER'],
    '/mitglieder': ['ADMIN', 'EDITOR', 'VIEWER'],
    '/mitglieder/neu': ['ADMIN', 'EDITOR'],
    '/admin': ['ADMIN'],
  }

  const allowed = accessMap[route]
  if (!allowed) {
    // Default: allow all authenticated users
    return true
  }

  return allowed.includes(userRole)
}

/**
 * Check if user has at least the given role
 */
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  const requiredIndex = roleHierarchy.indexOf(requiredRole)
  const currentIndex = roleHierarchy.indexOf(userRole)
  return currentIndex <= requiredIndex
}

/**
 * Check if user is admin
 */
export function isAdmin(userRole: UserRole): boolean {
  return userRole === 'ADMIN'
}

/**
 * Check if user can edit (ADMIN or EDITOR)
 */
export function canEdit(userRole: UserRole): boolean {
  return hasRole(userRole, 'EDITOR')
}
