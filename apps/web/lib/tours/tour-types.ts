/**
 * Tour system types
 * Defines interactive step-by-step guides throughout the application
 */

import type { DriveStep } from 'driver.js'

/**
 * Tour IDs for different workflows
 */
export type TourId =
  // Dashboard
  | 'dashboard:vorstand-overview'
  | 'dashboard:member-overview'
  // Aufführungen
  | 'auffuehrung:planen'
  | 'auffuehrung:schichten-erstellen'
  | 'auffuehrung:helfer-zuweisen'
  // Veranstaltungen
  | 'veranstaltung:erstellen'
  | 'veranstaltung:anmeldungen'
  // Mitglieder
  | 'mitglieder:neu-anlegen'
  | 'mitglieder:rollen-zuweisen'
  | 'mitglieder:stundenkonto'
  // Stücke
  | 'stueck:erstellen'
  | 'stueck:szenen-rollen'
  | 'stueck:besetzung'

/**
 * Access level required for a tour
 */
export type TourAccessLevel = 'all' | 'management' | 'admin'

/**
 * Tour definition
 */
export interface TourDefinition {
  /** Unique identifier */
  id: TourId
  /** Display title */
  title: string
  /** Brief description */
  description: string
  /** Minimum access level required */
  accessLevel: TourAccessLevel
  /** Category for grouping */
  category: string
  /** Tour steps */
  steps: DriveStep[]
  /** Related tour IDs */
  relatedTours?: TourId[]
}

/**
 * Tour category
 */
export interface TourCategory {
  name: string
  label: string
  description: string
}
