'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../supabase/server'
import { requirePermission, getUserProfile } from '../supabase/auth-helpers'
import type { StundenkontoInsert } from '../supabase/types'

// =============================================================================
// Types
// =============================================================================

export type StundenPreviewHelfer = {
  personId: string
  name: string
  email: string | null
  stunden: number
  schichten: {
    rolle: string
    zeitblock: string
    startzeit: string
    endzeit: string
    stunden: number
  }[]
  isExtern: boolean
}

export type StundenErfassungPreview = {
  veranstaltungId: string
  veranstaltungTitel: string
  veranstaltungDatum: string
  helfer: StundenPreviewHelfer[]
  externeHelfer: number
  gesamtStunden: number
  bereitsErfasst: boolean
  bereitsErfasstAm: string | null
}

export type StundenErfassungResult = {
  success: boolean
  error?: string
  anzahlEintraege?: number
  gesamtStunden?: number
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Calculate hours from start and end time
 * Rounds to nearest 15-minute interval (0.25 hours)
 */
function calculateHours(startzeit: string, endzeit: string): number {
  const start = new Date(`2000-01-01T${startzeit}`)
  const end = new Date(`2000-01-01T${endzeit}`)
  let hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)

  // Handle negative hours (overnight shifts)
  if (hours < 0) {
    hours += 24
  }

  // Round to nearest 0.25 (15 minutes)
  return Math.round(hours * 4) / 4
}

/**
 * Format time for display
 */
function formatTime(time: string): string {
  return time.substring(0, 5)
}

// =============================================================================
// Data Fetching
// =============================================================================

/**
 * Get preview data for stunden erfassung
 */
export async function getStundenErfassungPreview(
  veranstaltungId: string
): Promise<StundenErfassungPreview | null> {
  await requirePermission('stundenkonto:write')

  const supabase = await createClient()

  // Get veranstaltung
  const { data: veranstaltung, error: veranstaltungError } = await supabase
    .from('veranstaltungen')
    .select('id, titel, datum, helfer_status')
    .eq('id', veranstaltungId)
    .single()

  if (veranstaltungError || !veranstaltung) {
    console.error('Error fetching veranstaltung:', veranstaltungError)
    return null
  }

  // Check if stunden already erfasst for this veranstaltung
  const { data: existingEintraege } = await supabase
    .from('stundenkonto')
    .select('id, created_at')
    .eq('referenz_id', veranstaltungId)
    .eq('typ', 'vereinsevent')
    .limit(1)

  const bereitsErfasst = (existingEintraege?.length || 0) > 0
  const bereitsErfasstAm = existingEintraege?.[0]?.created_at || null

  // Get all zuweisungen with check-in data
  const { data: schichten, error: schichtenError } = await supabase
    .from('auffuehrung_schichten')
    .select(`
      id,
      rolle,
      zeitblock:zeitbloecke(id, name, startzeit, endzeit),
      zuweisungen:auffuehrung_zuweisungen(
        id,
        person_id,
        checked_in_at,
        no_show,
        status,
        person:personen(id, vorname, nachname, email)
      )
    `)
    .eq('veranstaltung_id', veranstaltungId)

  if (schichtenError) {
    console.error('Error fetching schichten:', schichtenError)
    return null
  }

  // Also check for external helper zuweisungen
  // External helpers are stored via the externe_helfer_profile link in zuweisungen
  // but person_id still points to a personen entry
  // We need to identify which helpers are "internal" (have a linked profile)
  // vs external helpers

  // Get all person IDs from zuweisungen
  const personIds = new Set<string>()
  for (const schicht of schichten || []) {
    for (const zuw of schicht.zuweisungen || []) {
      if (zuw.person_id && zuw.checked_in_at && !zuw.no_show) {
        personIds.add(zuw.person_id)
      }
    }
  }

  // Check which persons have a linked profile (internal vs external)
  // Internal helpers have their email linked to a profile
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email')
    .in('email', await getPersonEmails(supabase, Array.from(personIds)))

  const profileEmails = new Set(profiles?.map((p) => p.email) || [])

  // Build helper map
  const helferMap = new Map<string, StundenPreviewHelfer>()
  let externeCount = 0

  for (const schicht of schichten || []) {
    const zeitblockData = schicht.zeitblock as unknown as {
      id: string
      name: string
      startzeit: string
      endzeit: string
    } | null

    for (const zuw of schicht.zuweisungen || []) {
      // Only process checked-in helpers who are not no-shows
      if (!zuw.checked_in_at || zuw.no_show || zuw.status === 'abgesagt') {
        continue
      }

      const personData = zuw.person as unknown as {
        id: string
        vorname: string
        nachname: string
        email: string | null
      } | null

      if (!personData) continue

      // Check if this is an internal helper (has profile)
      const isExtern = !personData.email || !profileEmails.has(personData.email)

      if (isExtern) {
        externeCount++
        continue // Skip external helpers - they don't have stundenkonto
      }

      // Calculate hours for this shift
      let stunden = 0
      if (zeitblockData?.startzeit && zeitblockData?.endzeit) {
        stunden = calculateHours(zeitblockData.startzeit, zeitblockData.endzeit)
      }

      // Add to helfer map
      const key = personData.id
      if (!helferMap.has(key)) {
        helferMap.set(key, {
          personId: personData.id,
          name: `${personData.vorname} ${personData.nachname}`,
          email: personData.email,
          stunden: 0,
          schichten: [],
          isExtern: false,
        })
      }

      const helfer = helferMap.get(key)!
      helfer.stunden += stunden
      helfer.schichten.push({
        rolle: schicht.rolle,
        zeitblock: zeitblockData?.name || 'Ohne Zeitblock',
        startzeit: zeitblockData?.startzeit ? formatTime(zeitblockData.startzeit) : '--:--',
        endzeit: zeitblockData?.endzeit ? formatTime(zeitblockData.endzeit) : '--:--',
        stunden,
      })
    }
  }

  // Calculate total
  const helferList = Array.from(helferMap.values())
  const gesamtStunden = helferList.reduce((sum, h) => sum + h.stunden, 0)

  return {
    veranstaltungId: veranstaltung.id,
    veranstaltungTitel: veranstaltung.titel,
    veranstaltungDatum: veranstaltung.datum,
    helfer: helferList,
    externeHelfer: externeCount,
    gesamtStunden,
    bereitsErfasst,
    bereitsErfasstAm,
  }
}

/**
 * Helper to get person emails
 */
async function getPersonEmails(
  supabase: Awaited<ReturnType<typeof createClient>>,
  personIds: string[]
): Promise<string[]> {
  if (personIds.length === 0) return []

  const { data } = await supabase
    .from('personen')
    .select('email')
    .in('id', personIds)
    .not('email', 'is', null)

  return data?.map((p) => p.email).filter(Boolean) as string[] || []
}

// =============================================================================
// Actions
// =============================================================================

/**
 * Create stundenkonto entries for all checked-in helpers
 */
export async function createStundenkontoEintraege(
  veranstaltungId: string,
  overwrite: boolean = false
): Promise<StundenErfassungResult> {
  await requirePermission('stundenkonto:write')

  const profile = await getUserProfile()
  if (!profile) {
    return { success: false, error: 'Nicht eingeloggt' }
  }

  const supabase = await createClient()

  // Get preview data
  const preview = await getStundenErfassungPreview(veranstaltungId)
  if (!preview) {
    return { success: false, error: 'Veranstaltung nicht gefunden' }
  }

  // Check if already erfasst
  if (preview.bereitsErfasst && !overwrite) {
    const date = preview.bereitsErfasstAm
      ? new Date(preview.bereitsErfasstAm).toLocaleDateString('de-CH')
      : 'unbekannt'
    return {
      success: false,
      error: `Stunden wurden bereits am ${date} erfasst. Verwende "Erneut erfassen" um die Eintraege zu ueberschreiben.`,
    }
  }

  // If overwrite, delete existing entries first
  if (overwrite && preview.bereitsErfasst) {
    const { error: deleteError } = await supabase
      .from('stundenkonto')
      .delete()
      .eq('referenz_id', veranstaltungId)
      .eq('typ', 'vereinsevent')

    if (deleteError) {
      console.error('Error deleting existing entries:', deleteError)
      return { success: false, error: 'Fehler beim Loeschen der bestehenden Eintraege' }
    }
  }

  // No helpers to process
  if (preview.helfer.length === 0) {
    return {
      success: true,
      anzahlEintraege: 0,
      gesamtStunden: 0,
    }
  }

  // Create entries
  const eintraege: StundenkontoInsert[] = preview.helfer.map((helfer) => {
    // Build description with roles
    const rollen = [...new Set(helfer.schichten.map((s) => s.rolle))].join(', ')
    const beschreibung = `${preview.veranstaltungTitel} - ${rollen}`

    return {
      person_id: helfer.personId,
      typ: 'vereinsevent' as const,
      referenz_id: veranstaltungId,
      stunden: helfer.stunden,
      beschreibung,
      erfasst_von: profile.id,
    }
  })

  // Insert all entries
  const { error: insertError } = await supabase
    .from('stundenkonto')
    .insert(eintraege as never[])

  if (insertError) {
    console.error('Error inserting stundenkonto entries:', insertError)
    return { success: false, error: 'Fehler beim Erstellen der Stundenkonto-Eintraege' }
  }

  // Revalidate paths
  revalidatePath('/mein-bereich')
  revalidatePath('/mein-bereich/stundenkonto')
  revalidatePath(`/auffuehrungen/${veranstaltungId}`)
  revalidatePath(`/auffuehrungen/${veranstaltungId}/helfer-koordination`)

  return {
    success: true,
    anzahlEintraege: eintraege.length,
    gesamtStunden: preview.gesamtStunden,
  }
}

/**
 * Export stundenkonto erfassung data as CSV
 */
export async function exportStundenErfassungCSV(
  veranstaltungId: string
): Promise<{ success: boolean; csv?: string; error?: string }> {
  await requirePermission('stundenkonto:write')

  const preview = await getStundenErfassungPreview(veranstaltungId)
  if (!preview) {
    return { success: false, error: 'Veranstaltung nicht gefunden' }
  }

  const headers = ['Name', 'Email', 'Stunden', 'Rollen']
  const rows = preview.helfer.map((h) => [
    h.name,
    h.email || '',
    h.stunden.toString().replace('.', ','),
    [...new Set(h.schichten.map((s) => s.rolle))].join('; '),
  ])

  const csv = [headers, ...rows].map((row) => row.join(';')).join('\n')

  return { success: true, csv }
}
