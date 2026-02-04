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
