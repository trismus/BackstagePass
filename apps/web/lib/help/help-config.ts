/**
 * Help system configuration
 * Maps context keys to markdown files in docs/user-guide/
 */

/**
 * Context keys for help topics throughout the application
 */
export type HelpContextKey =
  // General
  | 'dashboard'
  | 'navigation'
  // Mein Bereich
  | 'profil'
  | 'einsaetze'
  | 'stundenkonto'
  // Veranstaltungen
  | 'veranstaltungen'
  | 'veranstaltungen:anmeldung'
  | 'helfereinsaetze'
  // Künstlerisch
  | 'stuecke'
  | 'besetzungen'
  | 'proben'
  // Verwaltung (VORSTAND+)
  | 'mitglieder'
  | 'mitglieder:neu'
  | 'mitglieder:rollen'
  | 'events:erstellen'
  | 'proben:planen'
  | 'berichte'
  // Admin
  | 'admin:benutzer'
  | 'admin:einstellungen'
  | 'admin:audit'
  // Overview
  | 'hilfe'

/**
 * Access level required for help content
 */
export type HelpAccessLevel = 'all' | 'management' | 'admin'

/**
 * Help topic configuration
 */
export interface HelpTopic {
  /** Path to markdown file relative to docs/user-guide/ */
  file: string
  /** Display title */
  title: string
  /** Brief description */
  description: string
  /** Minimum access level required */
  accessLevel: HelpAccessLevel
  /** Related topic keys */
  relatedTopics?: HelpContextKey[]
  /** Section name for grouping */
  section: string
}

/**
 * Mapping of context keys to help topics
 */
export const HELP_TOPICS: Record<HelpContextKey, HelpTopic> = {
  // Dashboard & Navigation
  dashboard: {
    file: '01-erste-schritte/dashboard.md',
    title: 'Dashboard Übersicht',
    description: 'Deine zentrale Anlaufstelle mit allen wichtigen Informationen',
    accessLevel: 'all',
    section: 'Erste Schritte',
    relatedTopics: ['navigation', 'veranstaltungen'],
  },
  navigation: {
    file: '01-erste-schritte/navigation.md',
    title: 'Navigation',
    description: 'Wie du dich in BackstagePass zurechtfindest',
    accessLevel: 'all',
    section: 'Erste Schritte',
    relatedTopics: ['dashboard'],
  },

  // Mein Bereich
  profil: {
    file: '02-mein-bereich/profil.md',
    title: 'Persönliche Daten',
    description: 'Dein Profil und persönliche Einstellungen',
    accessLevel: 'all',
    section: 'Mein Bereich',
    relatedTopics: ['stundenkonto', 'einsaetze'],
  },
  einsaetze: {
    file: '02-mein-bereich/einsaetze.md',
    title: 'Meine Einsätze',
    description: 'Übersicht über deine zugewiesenen Aufgaben',
    accessLevel: 'all',
    section: 'Mein Bereich',
    relatedTopics: ['stundenkonto', 'helfereinsaetze'],
  },
  stundenkonto: {
    file: '02-mein-bereich/stundenkonto.md',
    title: 'Stundenkonto',
    description: 'Dein aktueller Stundenstand und geleistete Arbeit',
    accessLevel: 'all',
    section: 'Mein Bereich',
    relatedTopics: ['einsaetze', 'profil'],
  },

  // Veranstaltungen
  veranstaltungen: {
    file: '03-veranstaltungen/events-ansehen.md',
    title: 'Events ansehen',
    description: 'Alle Vereinsveranstaltungen im Überblick',
    accessLevel: 'all',
    section: 'Veranstaltungen',
    relatedTopics: ['veranstaltungen:anmeldung', 'helfereinsaetze'],
  },
  'veranstaltungen:anmeldung': {
    file: '03-veranstaltungen/anmeldung.md',
    title: 'An- und Abmeldung',
    description: 'Wie du dich für Events an- und abmeldest',
    accessLevel: 'all',
    section: 'Veranstaltungen',
    relatedTopics: ['veranstaltungen', 'helfereinsaetze'],
  },
  helfereinsaetze: {
    file: '03-veranstaltungen/helfereinsaetze.md',
    title: 'Helfereinsätze',
    description: 'Externe Helferjobs und Arbeitseinsätze',
    accessLevel: 'all',
    section: 'Veranstaltungen',
    relatedTopics: ['einsaetze', 'stundenkonto'],
  },

  // Künstlerisch
  stuecke: {
    file: '04-kuenstlerisch/stuecke.md',
    title: 'Stücke & Produktionen',
    description: 'Aktuelle und geplante Theaterproduktionen',
    accessLevel: 'all',
    section: 'Künstlerisch',
    relatedTopics: ['besetzungen', 'proben'],
  },
  besetzungen: {
    file: '04-kuenstlerisch/besetzungen.md',
    title: 'Besetzungen',
    description: 'Rollenverteilung für die Produktionen',
    accessLevel: 'all',
    section: 'Künstlerisch',
    relatedTopics: ['stuecke', 'proben'],
  },
  proben: {
    file: '04-kuenstlerisch/proben.md',
    title: 'Proben',
    description: 'Probentermine und Ablauf',
    accessLevel: 'all',
    section: 'Künstlerisch',
    relatedTopics: ['stuecke', 'besetzungen'],
  },

  // Verwaltung (VORSTAND+)
  mitglieder: {
    file: '05-verwaltung/mitglieder.md',
    title: 'Mitglieder verwalten',
    description: 'Mitgliederverwaltung für Vorstand',
    accessLevel: 'management',
    section: 'Verwaltung',
    relatedTopics: ['mitglieder:neu', 'mitglieder:rollen'],
  },
  'mitglieder:neu': {
    file: '05-verwaltung/mitglieder.md',
    title: 'Neues Mitglied',
    description: 'Ein neues Mitglied anlegen',
    accessLevel: 'management',
    section: 'Verwaltung',
    relatedTopics: ['mitglieder', 'mitglieder:rollen'],
  },
  'mitglieder:rollen': {
    file: '05-verwaltung/mitglieder.md',
    title: 'Mitgliedsrollen',
    description: 'Die verschiedenen Vereinsrollen erklärt',
    accessLevel: 'management',
    section: 'Verwaltung',
    relatedTopics: ['mitglieder', 'admin:benutzer'],
  },
  'events:erstellen': {
    file: '05-verwaltung/events-erstellen.md',
    title: 'Events erstellen',
    description: 'Neue Veranstaltungen anlegen',
    accessLevel: 'management',
    section: 'Verwaltung',
    relatedTopics: ['veranstaltungen', 'proben:planen'],
  },
  'proben:planen': {
    file: '05-verwaltung/proben-planen.md',
    title: 'Proben planen',
    description: 'Proben erstellen und organisieren',
    accessLevel: 'management',
    section: 'Verwaltung',
    relatedTopics: ['proben', 'stuecke'],
  },
  berichte: {
    file: '05-verwaltung/berichte.md',
    title: 'Berichte & Statistiken',
    description: 'Auswertungen und Übersichten',
    accessLevel: 'management',
    section: 'Verwaltung',
    relatedTopics: ['stundenkonto', 'mitglieder'],
  },

  // Admin
  'admin:benutzer': {
    file: '06-admin/benutzer.md',
    title: 'Benutzer & Rollen',
    description: 'App-Benutzer und Zugriffsrechte verwalten',
    accessLevel: 'admin',
    section: 'Administration',
    relatedTopics: ['admin:einstellungen', 'mitglieder:rollen'],
  },
  'admin:einstellungen': {
    file: '06-admin/einstellungen.md',
    title: 'Systemeinstellungen',
    description: 'Globale App-Einstellungen',
    accessLevel: 'admin',
    section: 'Administration',
    relatedTopics: ['admin:benutzer', 'admin:audit'],
  },
  'admin:audit': {
    file: '06-admin/audit-log.md',
    title: 'Audit Log',
    description: 'Protokoll aller Systemaktivitäten',
    accessLevel: 'admin',
    section: 'Administration',
    relatedTopics: ['admin:benutzer', 'admin:einstellungen'],
  },

  // Overview
  hilfe: {
    file: 'README.md',
    title: 'Benutzerhandbuch',
    description: 'Übersicht über alle Hilfe-Themen',
    accessLevel: 'all',
    section: 'Übersicht',
    relatedTopics: ['dashboard', 'navigation'],
  },
}

/**
 * Get all topics grouped by section
 */
export function getTopicsBySection(): Record<string, HelpTopic[]> {
  const sections: Record<string, HelpTopic[]> = {}

  for (const topic of Object.values(HELP_TOPICS)) {
    if (!sections[topic.section]) {
      sections[topic.section] = []
    }
    sections[topic.section].push(topic)
  }

  return sections
}

/**
 * Get context key from file path
 */
export function getContextKeyFromFile(
  filePath: string
): HelpContextKey | null {
  for (const [key, topic] of Object.entries(HELP_TOPICS)) {
    if (topic.file === filePath) {
      return key as HelpContextKey
    }
  }
  return null
}
