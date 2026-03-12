/**
 * Tour access control
 * Determines which tours are available to which roles
 */

import type { UserRole } from '@/lib/supabase/types'
import type { TourAccessLevel, TourDefinition, TourId } from './tour-types'
import { TOURS } from './tour-config'

/**
 * Check if a role can access a tour access level
 */
export function canAccessTourLevel(
  role: UserRole,
  level: TourAccessLevel
): boolean {
  switch (level) {
    case 'all':
      return true
    case 'management':
      return role === 'ADMIN' || role === 'VORSTAND'
    case 'admin':
      return role === 'ADMIN'
    default:
      return false
  }
}

/**
 * Check if a role can access a specific tour
 */
export function canAccessTour(role: UserRole, tourId: TourId): boolean {
  const tour = TOURS[tourId]
  if (!tour) return false
  return canAccessTourLevel(role, tour.accessLevel)
}

/**
 * Get all accessible tours for a role
 */
export function getAccessibleTours(role: UserRole): TourDefinition[] {
  return Object.values(TOURS).filter((tour) =>
    canAccessTourLevel(role, tour.accessLevel)
  )
}

/**
 * Get accessible tours grouped by category
 */
export function getAccessibleToursByCategory(
  role: UserRole
): Record<string, TourDefinition[]> {
  const accessible = getAccessibleTours(role)
  const grouped: Record<string, TourDefinition[]> = {}

  for (const tour of accessible) {
    if (!grouped[tour.category]) {
      grouped[tour.category] = []
    }
    grouped[tour.category].push(tour)
  }

  return grouped
}

/**
 * Get accessible related tours
 */
export function getAccessibleRelatedTours(
  role: UserRole,
  tourIds?: TourId[]
): TourDefinition[] {
  if (!tourIds || tourIds.length === 0) return []

  return tourIds
    .map((id) => TOURS[id])
    .filter((tour): tour is TourDefinition => {
      return tour !== undefined && canAccessTourLevel(role, tour.accessLevel)
    })
}
