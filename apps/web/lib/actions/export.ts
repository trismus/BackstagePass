'use server'

import { getPersonenAdvanced, type MitgliederFilterParams } from './personen'
import type { Person } from '@/lib/supabase/types'

export type ExportColumn = {
  key: keyof Person | 'name'
  label: string
  enabled: boolean
}

export const DEFAULT_EXPORT_COLUMNS: ExportColumn[] = [
  { key: 'name', label: 'Name', enabled: true },
  { key: 'email', label: 'E-Mail', enabled: true },
  { key: 'telefon', label: 'Telefon', enabled: true },
  { key: 'rolle', label: 'Rolle', enabled: true },
  { key: 'skills', label: 'Skills', enabled: true },
  { key: 'mitglied_seit', label: 'Mitglied seit', enabled: true },
  { key: 'aktiv', label: 'Status', enabled: true },
  { key: 'strasse', label: 'Strasse', enabled: false },
  { key: 'plz', label: 'PLZ', enabled: false },
  { key: 'ort', label: 'Ort', enabled: false },
  { key: 'geburtstag', label: 'Geburtstag', enabled: false },
  { key: 'notizen', label: 'Notizen', enabled: false },
]

function formatValue(
  person: Person,
  column: ExportColumn['key']
): string {
  switch (column) {
    case 'name':
      return `${person.vorname} ${person.nachname}`
    case 'skills':
      return (person.skills || []).join(', ')
    case 'aktiv':
      return person.aktiv ? 'Aktiv' : 'Inaktiv'
    case 'mitglied_seit':
      return person.mitglied_seit
        ? new Date(person.mitglied_seit).toLocaleDateString('de-CH')
        : ''
    case 'geburtstag':
      return person.geburtstag
        ? new Date(person.geburtstag).toLocaleDateString('de-CH')
        : ''
    case 'rolle':
      const rolleLabels: Record<string, string> = {
        mitglied: 'Mitglied',
        vorstand: 'Vorstand',
        gast: 'Gast',
        regie: 'Regie',
        technik: 'Technik',
      }
      return rolleLabels[person.rolle] || person.rolle
    default:
      const value = person[column as keyof Person]
      if (value === null || value === undefined) return ''
      if (Array.isArray(value)) return value.join(', ')
      return String(value)
  }
}

function escapeCSV(value: string): string {
  // If value contains comma, newline, or quote, wrap in quotes and escape quotes
  if (value.includes(',') || value.includes('\n') || value.includes('"')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export async function exportMitgliederCSV(
  filterParams: MitgliederFilterParams = {},
  columns: ExportColumn[] = DEFAULT_EXPORT_COLUMNS
): Promise<{ csv: string; filename: string }> {
  const personen = await getPersonenAdvanced(filterParams)
  const enabledColumns = columns.filter((c) => c.enabled)

  // Header row
  const header = enabledColumns.map((c) => escapeCSV(c.label)).join(',')

  // Data rows
  const rows = personen.map((person) =>
    enabledColumns
      .map((col) => escapeCSV(formatValue(person, col.key)))
      .join(',')
  )

  const csv = [header, ...rows].join('\n')
  const statusLabel =
    filterParams.status === 'archiviert'
      ? '_archiviert'
      : filterParams.status === 'alle'
        ? '_alle'
        : ''
  const filename = `mitglieder${statusLabel}_${new Date().toISOString().split('T')[0]}.csv`

  return { csv, filename }
}

export async function exportMitgliederEmailList(
  filterParams: MitgliederFilterParams = {}
): Promise<{ emails: string; filename: string }> {
  const personen = await getPersonenAdvanced(filterParams)

  // Filter out persons without email and get unique emails
  const emails = personen
    .filter((p) => p.email)
    .map((p) => p.email as string)
    .filter((email, index, arr) => arr.indexOf(email) === index)

  const emailList = emails.join('; ')
  const filename = `mitglieder_emails_${new Date().toISOString().split('T')[0]}.txt`

  return { emails: emailList, filename }
}
