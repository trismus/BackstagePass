'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { requirePermission } from '@/lib/supabase/auth-helpers'
import type { PersonInsert, PartnerInsert, Rolle } from '@/lib/supabase/types'

// =============================================================================
// Types
// =============================================================================

export interface ImportResult {
  success: boolean
  imported: number
  skipped: number
  errors: { row: number; message: string }[]
}

export interface CsvPersonRow {
  vorname: string
  nachname: string
  email?: string
  telefon?: string
  strasse?: string
  plz?: string
  ort?: string
  geburtstag?: string
  rolle?: string
  notizen?: string
}

export interface CsvPartnerRow {
  name: string
  kontakt_name?: string
  kontakt_email?: string
  kontakt_telefon?: string
  adresse?: string
  notizen?: string
}

// =============================================================================
// Validation
// =============================================================================

const VALID_ROLLEN: Rolle[] = ['mitglied', 'vorstand', 'gast', 'regie', 'technik']

function validatePersonRow(
  row: CsvPersonRow,
  rowIndex: number
): { valid: boolean; error?: string; data?: PersonInsert } {
  // Required fields
  if (!row.vorname?.trim()) {
    return { valid: false, error: `Zeile ${rowIndex}: Vorname fehlt` }
  }
  if (!row.nachname?.trim()) {
    return { valid: false, error: `Zeile ${rowIndex}: Nachname fehlt` }
  }

  // Validate rolle if provided
  const rolle = (row.rolle?.toLowerCase() || 'mitglied') as Rolle
  if (!VALID_ROLLEN.includes(rolle)) {
    return {
      valid: false,
      error: `Zeile ${rowIndex}: Ungültige Rolle "${row.rolle}". Erlaubt: ${VALID_ROLLEN.join(', ')}`,
    }
  }

  // Validate date format if provided
  if (row.geburtstag && !/^\d{4}-\d{2}-\d{2}$/.test(row.geburtstag)) {
    return {
      valid: false,
      error: `Zeile ${rowIndex}: Ungültiges Datumsformat für Geburtstag. Erwartet: YYYY-MM-DD`,
    }
  }

  // Validate email format if provided
  if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
    return {
      valid: false,
      error: `Zeile ${rowIndex}: Ungültiges E-Mail-Format`,
    }
  }

  return {
    valid: true,
    data: {
      vorname: row.vorname.trim(),
      nachname: row.nachname.trim(),
      email: row.email?.trim() || null,
      telefon: row.telefon?.trim() || null,
      strasse: row.strasse?.trim() || null,
      plz: row.plz?.trim() || null,
      ort: row.ort?.trim() || null,
      geburtstag: row.geburtstag || null,
      rolle,
      aktiv: true,
      notizen: row.notizen?.trim() || null,
      // Extended profile fields (default values for import)
      notfallkontakt_name: null,
      notfallkontakt_telefon: null,
      notfallkontakt_beziehung: null,
      profilbild_url: null,
      biografie: null,
      mitglied_seit: null,
      austrittsdatum: null,
      austrittsgrund: null,
      skills: [],
      // Extended contact fields (default values for import)
      telefon_nummern: [],
      bevorzugte_kontaktart: null,
      social_media: null,
      kontakt_notizen: null,
      // Archive fields (default values for import)
      archiviert_am: null,
      archiviert_von: null,
    },
  }
}

function validatePartnerRow(
  row: CsvPartnerRow,
  rowIndex: number
): { valid: boolean; error?: string; data?: PartnerInsert } {
  if (!row.name?.trim()) {
    return { valid: false, error: `Zeile ${rowIndex}: Name fehlt` }
  }

  // Validate email format if provided
  if (row.kontakt_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.kontakt_email)) {
    return {
      valid: false,
      error: `Zeile ${rowIndex}: Ungültiges E-Mail-Format`,
    }
  }

  return {
    valid: true,
    data: {
      name: row.name.trim(),
      kontakt_name: row.kontakt_name?.trim() || null,
      kontakt_email: row.kontakt_email?.trim() || null,
      kontakt_telefon: row.kontakt_telefon?.trim() || null,
      adresse: row.adresse?.trim() || null,
      notizen: row.notizen?.trim() || null,
      aktiv: true,
    },
  }
}

// =============================================================================
// Import Actions
// =============================================================================

export async function importPersonen(
  rows: CsvPersonRow[]
): Promise<ImportResult> {
  await requirePermission('mitglieder:write')
  const supabase = await createClient()

  const result: ImportResult = {
    success: true,
    imported: 0,
    skipped: 0,
    errors: [],
  }

  const validRows: PersonInsert[] = []

  // Validate all rows first
  for (let i = 0; i < rows.length; i++) {
    const validation = validatePersonRow(rows[i], i + 2) // +2 for header row + 1-indexed
    if (validation.valid && validation.data) {
      validRows.push(validation.data)
    } else if (validation.error) {
      result.errors.push({ row: i + 2, message: validation.error })
    }
  }

  // Check for duplicate emails in import
  const emails = validRows.filter((r) => r.email).map((r) => r.email!)
  const uniqueEmails = new Set(emails)
  if (emails.length !== uniqueEmails.size) {
    result.errors.push({ row: 0, message: 'Doppelte E-Mail-Adressen im Import gefunden' })
  }

  // Check against existing emails in database
  if (uniqueEmails.size > 0) {
    const { data: existing } = await supabase
      .from('personen')
      .select('email')
      .in('email', [...uniqueEmails])

    if (existing && existing.length > 0) {
      const existingEmails = existing.map((e) => e.email)
      result.errors.push({
        row: 0,
        message: `Folgende E-Mails existieren bereits: ${existingEmails.join(', ')}`,
      })
    }
  }

  // If there are validation errors, don't import
  if (result.errors.length > 0) {
    result.success = false
    return result
  }

  // Insert valid rows
  const { data, error } = await supabase
    .from('personen')
    .insert(validRows)
    .select('id')

  if (error) {
    result.success = false
    result.errors.push({ row: 0, message: `Datenbankfehler: ${error.message}` })
    return result
  }

  result.imported = data?.length || 0
  result.skipped = rows.length - result.imported

  revalidatePath('/mitglieder')
  revalidatePath('/admin')

  return result
}

export async function importPartner(
  rows: CsvPartnerRow[]
): Promise<ImportResult> {
  await requirePermission('partner:write')
  const supabase = await createClient()

  const result: ImportResult = {
    success: true,
    imported: 0,
    skipped: 0,
    errors: [],
  }

  const validRows: PartnerInsert[] = []

  // Validate all rows first
  for (let i = 0; i < rows.length; i++) {
    const validation = validatePartnerRow(rows[i], i + 2)
    if (validation.valid && validation.data) {
      validRows.push(validation.data)
    } else if (validation.error) {
      result.errors.push({ row: i + 2, message: validation.error })
    }
  }

  // If there are validation errors, don't import
  if (result.errors.length > 0) {
    result.success = false
    return result
  }

  // Insert valid rows
  const { data, error } = await supabase
    .from('partner')
    .insert(validRows)
    .select('id')

  if (error) {
    result.success = false
    result.errors.push({ row: 0, message: `Datenbankfehler: ${error.message}` })
    return result
  }

  result.imported = data?.length || 0
  result.skipped = rows.length - result.imported

  revalidatePath('/partner')
  revalidatePath('/admin')

  return result
}

// =============================================================================
// Export Actions
// =============================================================================

export async function exportPersonen(): Promise<{
  success: boolean
  data?: string
  error?: string
}> {
  await requirePermission('mitglieder:read')
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('personen')
    .select('vorname, nachname, email, telefon, strasse, plz, ort, geburtstag, rolle, notizen, aktiv')
    .order('nachname')

  if (error) {
    return { success: false, error: error.message }
  }

  // Convert to CSV
  const headers = ['vorname', 'nachname', 'email', 'telefon', 'strasse', 'plz', 'ort', 'geburtstag', 'rolle', 'notizen', 'aktiv']
  const csvRows = [headers.join(',')]

  for (const row of data || []) {
    const values = headers.map((h) => {
      const val = row[h as keyof typeof row]
      if (val === null || val === undefined) return ''
      // Escape quotes and wrap in quotes if contains comma or quote
      const str = String(val)
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    })
    csvRows.push(values.join(','))
  }

  return { success: true, data: csvRows.join('\n') }
}

export async function exportPartner(): Promise<{
  success: boolean
  data?: string
  error?: string
}> {
  await requirePermission('partner:read')
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('partner')
    .select('name, kontakt_name, kontakt_email, kontakt_telefon, adresse, notizen, aktiv')
    .order('name')

  if (error) {
    return { success: false, error: error.message }
  }

  const headers = ['name', 'kontakt_name', 'kontakt_email', 'kontakt_telefon', 'adresse', 'notizen', 'aktiv']
  const csvRows = [headers.join(',')]

  for (const row of data || []) {
    const values = headers.map((h) => {
      const val = row[h as keyof typeof row]
      if (val === null || val === undefined) return ''
      const str = String(val)
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    })
    csvRows.push(values.join(','))
  }

  return { success: true, data: csvRows.join('\n') }
}
