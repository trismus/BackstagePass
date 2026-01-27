/**
 * Role-based access control for help content
 */

import { isAdmin, isManagement } from '../supabase/auth-helpers'
import type { UserRole } from '../supabase/types'
import type { HelpAccessLevel, HelpContextKey, HelpTopic } from './help-config'
import { HELP_TOPICS } from './help-config'

/**
 * Check if a user role can access a specific help access level
 */
export function canAccessHelpLevel(
  userRole: UserRole,
  accessLevel: HelpAccessLevel
): boolean {
  switch (accessLevel) {
    case 'all':
      return true
    case 'management':
      return isManagement(userRole)
    case 'admin':
      return isAdmin(userRole)
    default:
      return false
  }
}

/**
 * Check if a user can access a specific help topic
 */
export function canAccessHelpTopic(
  userRole: UserRole,
  contextKey: HelpContextKey
): boolean {
  const topic = HELP_TOPICS[contextKey]
  if (!topic) {
    return false
  }
  return canAccessHelpLevel(userRole, topic.accessLevel)
}

/**
 * Get all accessible topics for a user role
 */
export function getAccessibleTopics(userRole: UserRole): HelpTopic[] {
  return Object.values(HELP_TOPICS).filter((topic) =>
    canAccessHelpLevel(userRole, topic.accessLevel)
  )
}

/**
 * Get accessible topics grouped by section
 */
export function getAccessibleTopicsBySection(
  userRole: UserRole
): Record<string, HelpTopic[]> {
  const sections: Record<string, HelpTopic[]> = {}

  for (const topic of getAccessibleTopics(userRole)) {
    if (!sections[topic.section]) {
      sections[topic.section] = []
    }
    sections[topic.section].push(topic)
  }

  return sections
}

/**
 * Filter related topics based on user access
 */
export function getAccessibleRelatedTopics(
  userRole: UserRole,
  relatedKeys: HelpContextKey[] | undefined
): HelpTopic[] {
  if (!relatedKeys) return []

  return relatedKeys
    .filter((key) => canAccessHelpTopic(userRole, key))
    .map((key) => HELP_TOPICS[key])
    .filter(Boolean)
}
