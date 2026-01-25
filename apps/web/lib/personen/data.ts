/**
 * Personen Dummy Data
 * Fallback data when Supabase is not configured
 */

import type { Person } from '../supabase/types'

export const dummyPersonen: Person[] = [
  {
    id: '1',
    vorname: 'Anna',
    nachname: 'Müller',
    email: 'anna.mueller@theater.de',
    telefon: '+49 171 1234567',
    rolle: 'vorstand',
    aktiv: true,
    notizen: 'Erste Vorsitzende seit 2020',
    created_at: '2024-01-01T10:00:00Z',
    updated_at: '2024-01-01T10:00:00Z',
  },
  {
    id: '2',
    vorname: 'Max',
    nachname: 'Schmidt',
    email: 'max.schmidt@theater.de',
    telefon: '+49 172 2345678',
    rolle: 'regie',
    aktiv: true,
    notizen: 'Hauptregisseur, leitet Hamlet-Produktion',
    created_at: '2024-01-02T10:00:00Z',
    updated_at: '2024-01-02T10:00:00Z',
  },
  {
    id: '3',
    vorname: 'Lisa',
    nachname: 'Weber',
    email: 'lisa.weber@theater.de',
    telefon: '+49 173 3456789',
    rolle: 'mitglied',
    aktiv: true,
    notizen: null,
    created_at: '2024-01-03T10:00:00Z',
    updated_at: '2024-01-03T10:00:00Z',
  },
  {
    id: '4',
    vorname: 'Tom',
    nachname: 'Fischer',
    email: 'tom.fischer@theater.de',
    telefon: '+49 174 4567890',
    rolle: 'technik',
    aktiv: true,
    notizen: 'Licht und Ton',
    created_at: '2024-01-04T10:00:00Z',
    updated_at: '2024-01-04T10:00:00Z',
  },
  {
    id: '5',
    vorname: 'Sarah',
    nachname: 'Wagner',
    email: 'sarah.wagner@theater.de',
    telefon: '+49 175 5678901',
    rolle: 'mitglied',
    aktiv: true,
    notizen: null,
    created_at: '2024-01-05T10:00:00Z',
    updated_at: '2024-01-05T10:00:00Z',
  },
  {
    id: '6',
    vorname: 'Jan',
    nachname: 'Becker',
    email: null,
    telefon: '+49 176 6789012',
    rolle: 'gast',
    aktiv: false,
    notizen: 'Gastauftritt in 2023',
    created_at: '2024-01-06T10:00:00Z',
    updated_at: '2024-01-06T10:00:00Z',
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
      p.email?.toLowerCase().includes(q)
  )
}
