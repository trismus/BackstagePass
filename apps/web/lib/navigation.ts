/**
 * Zentrale Navigation-Konfiguration
 * Issue #3: Navigation-Konfiguration zentralisieren
 *
 * Diese Datei enthält die komplette Navigation für alle Benutzerrollen.
 */

import type { Permission, UserRole } from './supabase/types'
import { hasPermission } from './supabase/auth-helpers'

// =============================================================================
// Types
// =============================================================================

export interface NavItem {
  href: string
  label: string
  icon: NavIcon
  permission?: Permission
  /** Nur für ADMIN sichtbar */
  adminOnly?: boolean
}

export interface NavSection {
  title?: string
  items: NavItem[]
}

export interface NavConfig {
  startPage: string
  sidebar: NavSection[]
}

/**
 * Icon-Namen für die Navigation
 * Mapping zu SVG-Icons erfolgt in der Sidebar-Komponente
 */
export type NavIcon =
  | 'dashboard'
  | 'users'
  | 'partner'
  | 'calendar'
  | 'theater'
  | 'book'
  | 'rehearsal'
  | 'helper'
  | 'room'
  | 'equipment'
  | 'template'
  | 'user'
  | 'audit'
  | 'home'
  | 'clock'
  | 'check'
  | 'list'
  | 'mail'
  | 'eye'

// =============================================================================
// Startseiten pro Rolle
// =============================================================================

export const ROLE_START_PAGES: Record<UserRole, string> = {
  ADMIN: '/dashboard',
  VORSTAND: '/dashboard',
  MITGLIED_AKTIV: '/mein-bereich',
  MITGLIED_PASSIV: '/mein-bereich',
  HELFER: '/helfer',
  PARTNER: '/partner-portal',
  FREUNDE: '/willkommen',
}

// =============================================================================
// Navigation pro Rolle
// =============================================================================

/**
 * Management-Navigation (ADMIN, VORSTAND)
 */
const MANAGEMENT_NAVIGATION: NavSection[] = [
  {
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    ],
  },
  {
    title: 'Personen',
    items: [
      { href: '/mitglieder', label: 'Mitglieder', icon: 'users', permission: 'mitglieder:read' },
      { href: '/partner', label: 'Partner', icon: 'partner', permission: 'partner:read' },
    ],
  },
  {
    title: 'Veranstaltungen',
    items: [
      { href: '/veranstaltungen', label: 'Übersicht', icon: 'calendar' },
      { href: '/auffuehrungen', label: 'Aufführungen', icon: 'theater' },
      { href: '/stuecke', label: 'Stücke', icon: 'book', permission: 'stuecke:read' },
      { href: '/proben', label: 'Proben', icon: 'rehearsal' },
      { href: '/helfereinsaetze', label: 'Helfereinsätze', icon: 'helper', permission: 'helfereinsaetze:read' },
    ],
  },
  {
    title: 'Ressourcen',
    items: [
      { href: '/raeume', label: 'Räume', icon: 'room', permission: 'raeume:read' },
      { href: '/ressourcen', label: 'Ausstattung', icon: 'equipment', permission: 'ressourcen:read' },
      { href: '/templates', label: 'Templates', icon: 'template' },
    ],
  },
  {
    title: 'Ansichten',
    items: [
      { href: '/helfer', label: 'Helfer-Ansicht', icon: 'eye' },
      { href: '/partner-portal', label: 'Partner-Ansicht', icon: 'eye' },
    ],
  },
  {
    title: 'Admin',
    items: [
      { href: '/admin/users', label: 'Benutzer', icon: 'user', adminOnly: true },
      { href: '/admin/audit', label: 'Audit Log', icon: 'audit', adminOnly: true },
    ],
  },
]

/**
 * Mitglieder-Navigation (MITGLIED_AKTIV)
 */
const MITGLIED_AKTIV_NAVIGATION: NavSection[] = [
  {
    items: [
      { href: '/mein-bereich', label: 'Mein Bereich', icon: 'home' },
    ],
  },
  {
    title: 'Meine Aktivitäten',
    items: [
      { href: '/mein-bereich/termine', label: 'Meine Termine', icon: 'calendar' },
      { href: '/mein-bereich/stundenkonto', label: 'Stundenkonto', icon: 'clock' },
      { href: '/mein-bereich/anmeldungen', label: 'Anmeldungen', icon: 'check' },
    ],
  },
  {
    title: 'Theater',
    items: [
      { href: '/veranstaltungen', label: 'Veranstaltungen', icon: 'calendar' },
      { href: '/auffuehrungen', label: 'Aufführungen', icon: 'theater' },
      { href: '/proben', label: 'Proben', icon: 'rehearsal' },
    ],
  },
  {
    title: 'Helfen',
    items: [
      { href: '/helfereinsaetze', label: 'Helfereinsätze', icon: 'helper' },
    ],
  },
  {
    title: 'Ressourcen',
    items: [
      { href: '/raeume', label: 'Räume', icon: 'room' },
    ],
  },
]

/**
 * Mitglieder-Navigation (MITGLIED_PASSIV)
 */
const MITGLIED_PASSIV_NAVIGATION: NavSection[] = [
  {
    items: [
      { href: '/mein-bereich', label: 'Mein Bereich', icon: 'home' },
    ],
  },
  {
    title: 'Theater',
    items: [
      { href: '/veranstaltungen', label: 'Veranstaltungen', icon: 'calendar' },
      { href: '/auffuehrungen', label: 'Aufführungen', icon: 'theater' },
      { href: '/stuecke', label: 'Stücke', icon: 'book' },
    ],
  },
]

/**
 * Helfer-Navigation (HELFER)
 */
const HELFER_NAVIGATION: NavSection[] = [
  {
    items: [
      { href: '/helfer', label: 'Übersicht', icon: 'home' },
    ],
  },
  {
    title: 'Meine Einsätze',
    items: [
      { href: '/helfer/schichten', label: 'Meine Schichten', icon: 'list' },
      { href: '/helfer/einsaetze', label: 'Verfügbare Einsätze', icon: 'helper' },
    ],
  },
  {
    items: [
      { href: '/profile', label: 'Mein Profil', icon: 'user' },
    ],
  },
]

/**
 * Partner-Navigation (PARTNER)
 */
const PARTNER_NAVIGATION: NavSection[] = [
  {
    items: [
      { href: '/partner-portal', label: 'Partner-Portal', icon: 'home' },
    ],
  },
  {
    items: [
      { href: '/partner-portal/daten', label: 'Meine Daten', icon: 'partner' },
      { href: '/veranstaltungen', label: 'Veranstaltungen', icon: 'calendar' },
      { href: '/partner-portal/kontakt', label: 'Kontakt', icon: 'mail' },
    ],
  },
  {
    items: [
      { href: '/profile', label: 'Mein Profil', icon: 'user' },
    ],
  },
]

/**
 * Gäste-Navigation (FREUNDE)
 */
const FREUNDE_NAVIGATION: NavSection[] = [
  {
    items: [
      { href: '/willkommen', label: 'Willkommen', icon: 'home' },
    ],
  },
  {
    items: [
      { href: '/veranstaltungen', label: 'Veranstaltungen', icon: 'calendar' },
      { href: '/profile', label: 'Mein Profil', icon: 'user' },
    ],
  },
]

// =============================================================================
// Navigation-Config Mapping
// =============================================================================

const NAVIGATION_CONFIGS: Record<UserRole, NavConfig> = {
  ADMIN: {
    startPage: ROLE_START_PAGES.ADMIN,
    sidebar: MANAGEMENT_NAVIGATION,
  },
  VORSTAND: {
    startPage: ROLE_START_PAGES.VORSTAND,
    sidebar: MANAGEMENT_NAVIGATION,
  },
  MITGLIED_AKTIV: {
    startPage: ROLE_START_PAGES.MITGLIED_AKTIV,
    sidebar: MITGLIED_AKTIV_NAVIGATION,
  },
  MITGLIED_PASSIV: {
    startPage: ROLE_START_PAGES.MITGLIED_PASSIV,
    sidebar: MITGLIED_PASSIV_NAVIGATION,
  },
  HELFER: {
    startPage: ROLE_START_PAGES.HELFER,
    sidebar: HELFER_NAVIGATION,
  },
  PARTNER: {
    startPage: ROLE_START_PAGES.PARTNER,
    sidebar: PARTNER_NAVIGATION,
  },
  FREUNDE: {
    startPage: ROLE_START_PAGES.FREUNDE,
    sidebar: FREUNDE_NAVIGATION,
  },
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Gibt die Navigation-Konfiguration für eine Rolle zurück
 */
export function getNavigationForRole(role: UserRole): NavConfig {
  return NAVIGATION_CONFIGS[role]
}

/**
 * Gibt die Startseite für eine Rolle zurück
 */
export function getStartPageForRole(role: UserRole): string {
  return ROLE_START_PAGES[role]
}

/**
 * Prüft ob ein Benutzer auf eine Route zugreifen darf
 */
export function canAccessRoute(role: UserRole, route: string): boolean {
  // ADMIN und VORSTAND können alle Bereiche sehen
  if (role === 'ADMIN' || role === 'VORSTAND') {
    return true
  }

  // Prüfe rollenspezifische Routen
  const roleRoutes: Record<string, UserRole[]> = {
    '/dashboard': ['ADMIN', 'VORSTAND'],
    '/mitglieder': ['ADMIN', 'VORSTAND'],
    '/partner': ['ADMIN', 'VORSTAND', 'PARTNER'],
    '/helfer': ['ADMIN', 'VORSTAND', 'HELFER'],
    '/partner-portal': ['ADMIN', 'VORSTAND', 'PARTNER'],
    '/admin': ['ADMIN'],
    '/helfereinsaetze': ['ADMIN', 'VORSTAND', 'MITGLIED_AKTIV', 'HELFER'],
    '/mein-bereich': ['ADMIN', 'VORSTAND', 'MITGLIED_AKTIV', 'MITGLIED_PASSIV'],
  }

  // Prüfe ob Route eingeschränkt ist
  for (const [routePrefix, allowedRoles] of Object.entries(roleRoutes)) {
    if (route.startsWith(routePrefix)) {
      return allowedRoles.includes(role)
    }
  }

  // Standardmäßig erlaubt (öffentliche Routen wie /veranstaltungen)
  return true
}

/**
 * Filtert die Navigation basierend auf Berechtigungen
 * Entfernt Items die der Benutzer nicht sehen darf
 */
export function filterNavigationByPermissions(
  sections: NavSection[],
  role: UserRole
): NavSection[] {
  const isAdmin = role === 'ADMIN'

  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        // Admin-only Items nur für ADMIN
        if (item.adminOnly && !isAdmin) {
          return false
        }

        // Permission-basierte Filterung
        if (item.permission && !hasPermission(role, item.permission)) {
          return false
        }

        return true
      }),
    }))
    .filter((section) => section.items.length > 0) // Leere Sections entfernen
}

/**
 * Gibt die gefilterte Navigation für eine Rolle zurück
 */
export function getFilteredNavigationForRole(role: UserRole): NavConfig {
  const config = getNavigationForRole(role)
  return {
    ...config,
    sidebar: filterNavigationByPermissions(config.sidebar, role),
  }
}

/**
 * Breadcrumb-Konfiguration
 * Mapping von Routen zu lesbaren Labels
 */
export const BREADCRUMB_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  mitglieder: 'Mitglieder',
  partner: 'Partner',
  veranstaltungen: 'Veranstaltungen',
  auffuehrungen: 'Aufführungen',
  stuecke: 'Stücke',
  proben: 'Proben',
  helfereinsaetze: 'Helfereinsätze',
  raeume: 'Räume',
  ressourcen: 'Ausstattung',
  templates: 'Templates',
  admin: 'Admin',
  users: 'Benutzer',
  audit: 'Audit Log',
  'mein-bereich': 'Mein Bereich',
  termine: 'Meine Termine',
  stundenkonto: 'Stundenkonto',
  anmeldungen: 'Anmeldungen',
  helfer: 'Helfer',
  schichten: 'Meine Schichten',
  einsaetze: 'Verfügbare Einsätze',
  'partner-portal': 'Partner-Portal',
  daten: 'Meine Daten',
  kontakt: 'Kontakt',
  willkommen: 'Willkommen',
  profile: 'Profil',
  bearbeiten: 'Bearbeiten',
  neu: 'Neu',
}

/**
 * Generiert Breadcrumbs aus einem Pfad
 */
export function generateBreadcrumbs(
  pathname: string
): { label: string; href: string }[] {
  const segments = pathname.split('/').filter(Boolean)

  // Keine Breadcrumbs bei Tiefe <= 1
  if (segments.length <= 1) {
    return []
  }

  return segments.map((segment, index) => {
    const href = '/' + segments.slice(0, index + 1).join('/')
    const label = BREADCRUMB_LABELS[segment] || segment
    return { label, href }
  })
}

/**
 * Prüft ob Management-Rolle (ADMIN oder VORSTAND)
 */
export function isManagementRole(role: UserRole): boolean {
  return role === 'ADMIN' || role === 'VORSTAND'
}

/**
 * Gibt den Redirect-Pfad zurück wenn Benutzer auf falsche Startseite zugreift
 */
export function getRedirectIfNeeded(role: UserRole, currentPath: string): string | null {
  // Management kann überall hin
  if (isManagementRole(role)) {
    return null
  }

  // Prüfe ob Zugriff erlaubt
  if (!canAccessRoute(role, currentPath)) {
    return getStartPageForRole(role)
  }

  return null
}
