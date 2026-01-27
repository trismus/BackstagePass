/**
 * Client-safe permission utilities
 *
 * This file contains permission checking functions that can be used
 * in both client and server components. It does not import any
 * server-side code.
 */

import type { UserRole, Permission } from './types'

/**
 * Permission matrix: which roles have which capabilities
 */
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    'admin:access',
    'mitglieder:read',
    'mitglieder:write',
    'mitglieder:delete',
    'profile:write_own',
    'veranstaltungen:read',
    'veranstaltungen:write',
    'veranstaltungen:delete',
    'veranstaltungen:register',
    'helfereinsaetze:read',
    'helfereinsaetze:write',
    'helfereinsaetze:delete',
    'helfereinsaetze:register',
    'helferliste:read',
    'helferliste:write',
    'helferliste:delete',
    'helferliste:register',
    'stundenkonto:read',
    'stundenkonto:read_own',
    'stundenkonto:write',
    'partner:read',
    'partner:write',
    'partner:delete',
    'stuecke:read',
    'stuecke:write',
    'stuecke:delete',
    'raeume:read',
    'raeume:write',
    'ressourcen:read',
    'ressourcen:write',
  ],

  VORSTAND: [
    'mitglieder:read',
    'mitglieder:write',
    'mitglieder:delete',
    'profile:write_own',
    'veranstaltungen:read',
    'veranstaltungen:write',
    'veranstaltungen:delete',
    'veranstaltungen:register',
    'helfereinsaetze:read',
    'helfereinsaetze:write',
    'helfereinsaetze:delete',
    'helfereinsaetze:register',
    'helferliste:read',
    'helferliste:write',
    'helferliste:delete',
    'helferliste:register',
    'stundenkonto:read',
    'stundenkonto:read_own',
    'stundenkonto:write',
    'partner:read',
    'partner:write',
    'partner:delete',
    'stuecke:read',
    'stuecke:write',
    'stuecke:delete',
    'raeume:read',
    'raeume:write',
    'ressourcen:read',
    'ressourcen:write',
  ],

  MITGLIED_AKTIV: [
    'profile:write_own',
    'veranstaltungen:read',
    'veranstaltungen:register',
    'helfereinsaetze:read',
    'helfereinsaetze:register',
    'helferliste:read',
    'helferliste:register',
    'stundenkonto:read_own',
    'stuecke:read',
    'raeume:read',
    'ressourcen:read',
  ],

  MITGLIED_PASSIV: [
    'profile:write_own',
    'veranstaltungen:read',
    'stuecke:read',
  ],

  HELFER: ['helfereinsaetze:read', 'helferliste:read', 'helferliste:register'],

  PARTNER: ['profile:write_own', 'veranstaltungen:read', 'partner:read'],

  FREUNDE: ['veranstaltungen:read'],
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(
  userRole: UserRole,
  permission: Permission
): boolean {
  const permissions = ROLE_PERMISSIONS[userRole]
  return permissions?.includes(permission) ?? false
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(
  userRole: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.some((p) => hasPermission(userRole, p))
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(
  userRole: UserRole,
  permissions: Permission[]
): boolean {
  return permissions.every((p) => hasPermission(userRole, p))
}

/**
 * Check if user is admin
 */
export function isAdmin(userRole: UserRole): boolean {
  return userRole === 'ADMIN'
}

/**
 * Check if user is management level (ADMIN or VORSTAND)
 */
export function isManagement(userRole: UserRole): boolean {
  return userRole === 'ADMIN' || userRole === 'VORSTAND'
}

/**
 * Check if user can edit content (ADMIN or VORSTAND)
 * @deprecated Use hasPermission() with specific permission instead
 */
export function canEdit(userRole: UserRole): boolean {
  return isManagement(userRole)
}

/**
 * Check if user can access a specific route based on role
 */
export function canAccess(route: string, userRole: UserRole): boolean {
  const routePermissions: Record<string, Permission[]> = {
    '/admin': ['admin:access'],
    '/admin/users': ['admin:access'],
    '/admin/audit': ['admin:access'],
    '/mitglieder': ['mitglieder:read'],
    '/mitglieder/neu': ['mitglieder:write'],
    '/partner': ['partner:read'],
    '/partner/neu': ['partner:write'],
    '/helfereinsaetze': ['helfereinsaetze:read'],
    '/helfereinsaetze/neu': ['helfereinsaetze:write'],
    '/stundenkonto': ['stundenkonto:read', 'stundenkonto:read_own'],
  }

  const required = routePermissions[route]
  if (!required) {
    // Default: allow all authenticated users
    return true
  }

  // User needs at least one of the required permissions
  return hasAnyPermission(userRole, required)
}

/**
 * @deprecated Linear hierarchy no longer applies. Use hasPermission() instead.
 */
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  // Approximate old behavior for backward compatibility
  if (requiredRole === 'ADMIN') {
    return userRole === 'ADMIN'
  }
  if (requiredRole === 'VORSTAND') {
    return isManagement(userRole)
  }
  // For other roles, check exact match
  return userRole === requiredRole
}
