/**
 * Tour configuration
 * Defines all interactive tours in the application
 */

import type { TourDefinition, TourCategory } from './tour-types'

/**
 * Tour categories
 */
export const TOUR_CATEGORIES: TourCategory[] = [
  {
    name: 'dashboard',
    label: 'Dashboard',
    description: 'Übersicht und Navigation',
  },
  {
    name: 'auffuehrungen',
    label: 'Aufführungen',
    description: 'Aufführungen planen und verwalten',
  },
  {
    name: 'veranstaltungen',
    label: 'Veranstaltungen',
    description: 'Events erstellen und organisieren',
  },
  {
    name: 'mitglieder',
    label: 'Mitglieder',
    description: 'Mitgliederverwaltung',
  },
  {
    name: 'stuecke',
    label: 'Stücke',
    description: 'Theaterproduktionen verwalten',
  },
]

/**
 * All tour definitions
 */
export const TOURS: Record<string, TourDefinition> = {
  'dashboard:vorstand-overview': {
    id: 'dashboard:vorstand-overview',
    title: 'Vorstand Dashboard Tour',
    description: 'Entdecke alle Funktionen deines Vorstand-Dashboards',
    accessLevel: 'management',
    category: 'dashboard',
    steps: [
      {
        element: 'body',
        popover: {
          title: 'Willkommen beim Vorstand Dashboard',
          description:
            'Diese Tour zeigt dir die wichtigsten Funktionen für die Verwaltung deines Theatervereins. Du kannst die Tour jederzeit mit ESC beenden.',
          side: 'top',
          align: 'center',
        },
      },
      {
        element: '[data-tour="dashboard-modules"]',
        popover: {
          title: '3-Säulen-Übersicht',
          description:
            'Das Dashboard ist in drei Bereiche unterteilt: Mitglieder & Helfer, Künstlerische Produktion, und Produktion & Logistik. Jeder Bereich zeigt dir die wichtigsten Kennzahlen und Handlungsbedarf.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-tour="quick-actions"]',
        popover: {
          title: 'Schnellaktionen',
          description:
            'Hier findest du Direktzugriff auf häufig genutzte Funktionen wie "Neue Veranstaltung", "Neues Mitglied" oder "Neuer Helfereinsatz".',
          side: 'top',
          align: 'start',
        },
      },
      {
        element: '[data-tour="help-button"]',
        popover: {
          title: 'Hilfe-Button',
          description:
            'Bei Fragen findest du hier kontextbezogene Hilfe und weitere Anleitungen. Klicke auf das Fragezeichen-Icon, um detaillierte Dokumentation zu erhalten.',
          side: 'bottom',
          align: 'start',
        },
      },
    ],
  },

  'auffuehrung:planen': {
    id: 'auffuehrung:planen',
    title: 'Aufführung planen',
    description: 'Schritt-für-Schritt: Eine neue Aufführung planen',
    accessLevel: 'management',
    category: 'auffuehrungen',
    steps: [
      {
        element: 'body',
        popover: {
          title: 'Aufführung planen',
          description:
            'Diese Tour führt dich durch den kompletten Prozess einer Aufführungsplanung - von der Template-Auswahl bis zur Helfer-Zuweisung.',
          side: 'top',
          align: 'center',
        },
      },
      {
        element: '[data-tour="auffuehrung-neu-button"]',
        popover: {
          title: 'Neue Aufführung erstellen',
          description:
            'Klicke hier, um eine neue Aufführung anzulegen. Du kannst entweder ein Template verwenden oder von Grund auf neu starten.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-tour="template-auswahl"]',
        popover: {
          title: 'Template auswählen',
          description:
            'Templates enthalten vordefinierte Zeitblöcke und Schichtrollen. Das spart dir viel Zeit bei der Planung. Du kannst Templates unter "Templates" verwalten.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '[data-tour="zeitbloecke"]',
        popover: {
          title: 'Zeitblöcke definieren',
          description:
            'Zeitblöcke strukturieren deine Aufführung (z.B. Einlass, Vorstellung, Abbau). Jeder Zeitblock kann mehrere Schichten enthalten.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '[data-tour="schichten"]',
        popover: {
          title: 'Schichten erstellen',
          description:
            'Pro Zeitblock kannst du Schichten mit Helferrollen definieren (z.B. Einlass: 2x Billettverkauf, 1x Garderobe). Gib an, wie viele Personen du pro Rolle benötigst.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '[data-tour="helfer-zuweisen"]',
        popover: {
          title: 'Helfer zuweisen',
          description:
            'Nach dem Erstellen kannst du unter "Helfer-Koordination" Personen den Schichten zuweisen. Das System zeigt dir verfügbare Helfer basierend auf ihren Fähigkeiten.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: 'body',
        popover: {
          title: 'Fertig!',
          description:
            'Du hast gelernt, wie man eine Aufführung plant. Probiere es jetzt selbst aus oder starte eine andere Tour.',
          side: 'top',
          align: 'center',
        },
      },
    ],
    relatedTours: ['veranstaltung:erstellen', 'auffuehrung:helfer-zuweisen'],
  },

  'veranstaltung:erstellen': {
    id: 'veranstaltung:erstellen',
    title: 'Veranstaltung erstellen',
    description: 'Neue Proben, Vereinsevents oder sonstige Events anlegen',
    accessLevel: 'management',
    category: 'veranstaltungen',
    steps: [
      {
        element: 'body',
        popover: {
          title: 'Veranstaltung erstellen',
          description:
            'Lerne, wie du Proben, Vereinsevents oder sonstige Veranstaltungen anlegst und Anmeldungen verwaltest.',
          side: 'top',
          align: 'center',
        },
      },
      {
        element: '[data-tour="veranstaltung-neu-button"]',
        popover: {
          title: 'Neue Veranstaltung',
          description:
            'Klicke hier, um eine neue Veranstaltung anzulegen. Du kannst zwischen verschiedenen Typen wählen: Probe, Vereinsevent, Aufführung oder Sonstiges.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-tour="event-typ"]',
        popover: {
          title: 'Event-Typ wählen',
          description:
            'Der Typ bestimmt, welche Funktionen verfügbar sind. Proben können mit Stücken verknüpft werden, Aufführungen haben Schichtverwaltung.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '[data-tour="event-details"]',
        popover: {
          title: 'Event-Details',
          description:
            'Fülle Titel, Datum, Uhrzeit und Ort aus. Du kannst auch eine Beschreibung und maximale Teilnehmerzahl angeben.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '[data-tour="anmeldungen"]',
        popover: {
          title: 'Anmeldungen aktivieren',
          description:
            'Wenn aktiviert, können sich Mitglieder für die Veranstaltung an- und abmelden. Du siehst dann eine Liste aller Zu- und Absagen.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: 'body',
        popover: {
          title: 'Fertig!',
          description:
            'Du weißt jetzt, wie man Veranstaltungen erstellt. Die Veranstaltung erscheint im Kalender und auf dem Dashboard.',
          side: 'top',
          align: 'center',
        },
      },
    ],
    relatedTours: ['auffuehrung:planen', 'stueck:erstellen'],
  },

  'mitglieder:neu-anlegen': {
    id: 'mitglieder:neu-anlegen',
    title: 'Neues Mitglied anlegen',
    description: 'Schritt-für-Schritt: Ein neues Vereinsmitglied erfassen',
    accessLevel: 'management',
    category: 'mitglieder',
    steps: [
      {
        element: 'body',
        popover: {
          title: 'Neues Mitglied anlegen',
          description:
            'Diese Tour zeigt dir, wie du ein neues Mitglied im System erfasst und die wichtigsten Daten pflegst.',
          side: 'top',
          align: 'center',
        },
      },
      {
        element: '[data-tour="mitglied-neu-button"]',
        popover: {
          title: 'Neues Mitglied',
          description:
            'Klicke hier, um ein neues Mitglied anzulegen. Du musst mindestens Vorname und Nachname angeben.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-tour="person-basis"]',
        popover: {
          title: 'Basisdaten',
          description:
            'Erfasse Vorname, Nachname, Geburtsdatum und Kontaktdaten. Diese Daten werden für die Mitgliederverwaltung benötigt.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '[data-tour="person-rolle"]',
        popover: {
          title: 'Mitgliedsrolle',
          description:
            'Wähle die passende Rolle: Aktives Mitglied, Passives Mitglied, Helfer, Partner oder Freunde. Die Rolle bestimmt die Zugriffsrechte.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '[data-tour="person-aktiv"]',
        popover: {
          title: 'Aktiv/Inaktiv',
          description:
            'Setze das Mitglied auf "Aktiv", wenn es regelmäßig teilnimmt. Inaktive Mitglieder werden in Listen ausgeblendet.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '[data-tour="benutzer-konto"]',
        popover: {
          title: 'Benutzerkonto erstellen (Optional)',
          description:
            'Wenn das Mitglied Zugriff auf BackstagePass haben soll, kannst du unter Admin > Benutzer ein Login-Konto erstellen.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: 'body',
        popover: {
          title: 'Fertig!',
          description:
            'Das Mitglied ist jetzt erfasst und kann Veranstaltungen zugewiesen werden. Du kannst weitere Details jederzeit bearbeiten.',
          side: 'top',
          align: 'center',
        },
      },
    ],
    relatedTours: ['mitglieder:rollen-zuweisen', 'mitglieder:stundenkonto'],
  },

  'stueck:erstellen': {
    id: 'stueck:erstellen',
    title: 'Stück erstellen',
    description: 'Eine neue Theaterproduktion anlegen und strukturieren',
    accessLevel: 'management',
    category: 'stuecke',
    steps: [
      {
        element: 'body',
        popover: {
          title: 'Stück erstellen',
          description:
            'Lerne, wie du ein neues Theaterstück anlegst, Szenen definierst und Rollen besetzt.',
          side: 'top',
          align: 'center',
        },
      },
      {
        element: '[data-tour="stueck-neu-button"]',
        popover: {
          title: 'Neues Stück',
          description:
            'Klicke hier, um ein neues Stück anzulegen. Du kannst Titel, Autor, Premiere-Datum und weitere Details angeben.',
          side: 'bottom',
          align: 'start',
        },
      },
      {
        element: '[data-tour="stueck-details"]',
        popover: {
          title: 'Stück-Details',
          description:
            'Erfasse alle wichtigen Informationen: Titel, Autor, Genre, Premiere-Datum und Status (In Planung, In Proben, Aktiv, Archiviert).',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '[data-tour="szenen-tab"]',
        popover: {
          title: 'Szenen definieren',
          description:
            'Gliedere dein Stück in Akte und Szenen. Das hilft bei der Probenplanung - du kannst Proben gezielt für einzelne Szenen ansetzen.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '[data-tour="rollen-tab"]',
        popover: {
          title: 'Rollen erstellen',
          description:
            'Definiere alle Rollen deines Stücks. Pro Rolle kannst du angeben, in welchen Szenen sie vorkommt und wie umfangreich sie ist.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: '[data-tour="besetzung-tab"]',
        popover: {
          title: 'Besetzung',
          description:
            'Weise den Rollen Schauspieler zu. Du kannst mehrere Besetzungen (A/B-Besetzung) und Doubletten definieren.',
          side: 'right',
          align: 'start',
        },
      },
      {
        element: 'body',
        popover: {
          title: 'Fertig!',
          description:
            'Dein Stück ist angelegt. Du kannst jetzt Proben planen und Aufführungen erstellen.',
          side: 'top',
          align: 'center',
        },
      },
    ],
    relatedTours: ['veranstaltung:erstellen', 'auffuehrung:planen'],
  },
}

/**
 * Get tours by category
 */
export function getToursByCategory(): Record<string, TourDefinition[]> {
  const grouped: Record<string, TourDefinition[]> = {}

  for (const tour of Object.values(TOURS)) {
    if (!grouped[tour.category]) {
      grouped[tour.category] = []
    }
    grouped[tour.category].push(tour)
  }

  return grouped
}

/**
 * Get tour by ID
 */
export function getTourById(id: string): TourDefinition | undefined {
  return TOURS[id]
}
