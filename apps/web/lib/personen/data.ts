/**
 * Personen Dummy Data
 * Fallback data when Supabase is not configured
 */

import type { Person } from '../supabase/types'

// Default values for extended profile fields
const defaultExtendedFields = {
  notfallkontakt_name: null,
  notfallkontakt_telefon: null,
  notfallkontakt_beziehung: null,
  profilbild_url: null,
  biografie: null,
  mitglied_seit: null,
  austrittsdatum: null,
  austrittsgrund: null,
  skills: [] as string[],
  // Extended contact fields (Issue #3)
  telefon_nummern: [] as { typ: 'mobil' | 'privat' | 'geschaeft'; nummer: string; ist_bevorzugt?: boolean }[],
  bevorzugte_kontaktart: null,
  social_media: null,
  kontakt_notizen: null,
  // Archive fields (Issue #5)
  archiviert_am: null,
  archiviert_von: null,
}

export const dummyPersonen: Person[] = [
  {
    id: '1',
    vorname: 'Anna',
    nachname: 'Müller',
    strasse: 'Theaterstraße 12',
    plz: '80331',
    ort: 'München',
    geburtstag: '1985-03-15',
    email: 'anna.mueller@theater.de',
    telefon: '+49 171 1234567',
    rolle: 'vorstand',
    aktiv: true,
    notizen: 'Erste Vorsitzende seit 2020',
    ...defaultExtendedFields,
    mitglied_seit: '2020-01-01',
    biografie: 'Seit 2020 Erste Vorsitzende der Theatergruppe.',
    skills: ['Organisation', 'Regie'],
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
  },
  {
    id: '2',
    vorname: 'Max',
    nachname: 'Schmidt',
    strasse: 'Bühnenweg 5',
    plz: '80333',
    ort: 'München',
    geburtstag: '1978-07-22',
    email: 'max.schmidt@theater.de',
    telefon: '+49 172 2345678',
    rolle: 'regie',
    aktiv: true,
    notizen: 'Hauptregisseur',
    ...defaultExtendedFields,
    mitglied_seit: '2015-06-01',
    skills: ['Regie', 'Schauspiel'],
    created_at: '2024-01-02T10:00:00Z',
    updated_at: '2024-01-02T10:00:00Z',
  },
  {
    id: '3',
    vorname: 'Lisa',
    nachname: 'Weber',
    strasse: 'Kulissenplatz 8',
    plz: '80335',
    ort: 'München',
    geburtstag: '1992-11-08',
    email: 'lisa.weber@theater.de',
    telefon: '+49 173 3456789',
    rolle: 'mitglied',
    aktiv: true,
    notizen: 'Schauspielerin',
    ...defaultExtendedFields,
    mitglied_seit: '2018-09-01',
    skills: ['Schauspiel', 'Gesang'],
    created_at: '2024-01-03T10:00:00Z',
    updated_at: '2024-01-03T10:00:00Z',
  },
  {
    id: '4',
    vorname: 'Tom',
    nachname: 'Fischer',
    strasse: 'Scheinwerferstr. 23',
    plz: '80337',
    ort: 'München',
    geburtstag: '1988-01-30',
    email: 'tom.fischer@theater.de',
    telefon: '+49 174 4567890',
    rolle: 'technik',
    aktiv: true,
    notizen: 'Licht und Ton',
    ...defaultExtendedFields,
    mitglied_seit: '2019-03-15',
    skills: ['Licht', 'Ton', 'Video'],
    created_at: '2024-01-04T10:00:00Z',
    updated_at: '2024-01-04T10:00:00Z',
  },
  {
    id: '5',
    vorname: 'Sarah',
    nachname: 'Wagner',
    strasse: 'Maskenbildnerallee 7',
    plz: '80339',
    ort: 'München',
    geburtstag: '1995-06-12',
    email: 'sarah.wagner@theater.de',
    telefon: '+49 175 5678901',
    rolle: 'mitglied',
    aktiv: true,
    notizen: 'Kostüm und Maske',
    ...defaultExtendedFields,
    mitglied_seit: '2021-01-10',
    skills: ['Kostüm', 'Maske', 'Requisite'],
    created_at: '2024-01-05T10:00:00Z',
    updated_at: '2024-01-05T10:00:00Z',
  },
]

export function getPersonById(id: string): Person | undefined {
  return dummyPersonen.find((p) => p.id === id)
}

export function getAllPersonen(): Person[] {
  return dummyPersonen
}

export function searchPersonen(query: string): Person[] {
  const q = query.toLowerCase()
  return dummyPersonen.filter(
    (p) =>
      p.vorname.toLowerCase().includes(q) ||
      p.nachname.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.ort?.toLowerCase().includes(q)
  )
}
