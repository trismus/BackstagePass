import type { Rolle, UserRole } from '../supabase/types'

/**
 * Map a person's Vereins-Rolle to the default app role
 */
export function getDefaultAppRole(rolle: Rolle): UserRole {
  switch (rolle) {
    case 'vorstand':
      return 'VORSTAND'
    case 'mitglied':
    case 'regie':
    case 'technik':
      return 'MITGLIED_AKTIV'
    case 'gast':
      return 'MITGLIED_PASSIV'
    default:
      return 'MITGLIED_AKTIV'
  }
}
