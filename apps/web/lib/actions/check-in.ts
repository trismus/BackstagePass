'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../supabase/server'
import { getUserProfile } from '../supabase/server'
import { requirePermission } from '../supabase/auth-helpers'
import type {
  CheckInOverview,
  ZeitblockMitCheckIns,
  ZuweisungMitCheckIn,
  CheckInStatus,
  ZeitblockTyp,
} from '../supabase/types'

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Determine check-in status from zuweisung data
 */
function getCheckInStatus(zuweisung: {
  checked_in_at: string | null
  no_show: boolean
}): CheckInStatus {
  if (zuweisung.no_show) return 'no_show'
  if (zuweisung.checked_in_at) return 'anwesend'
  return 'erwartet'
}

/**
 * Determine zeitblock status based on current time
 */
function getZeitblockStatus(
  startzeit: string,
  endzeit: string,
  veranstaltungDatum: string
): 'geplant' | 'aktiv' | 'abgeschlossen' {
  const now = new Date()
  const start = new Date(`${veranstaltungDatum}T${startzeit}`)
  const end = new Date(`${veranstaltungDatum}T${endzeit}`)

  if (now < start) return 'geplant'
  if (now > end) return 'abgeschlossen'
  return 'aktiv'
}

// =============================================================================
// Data Fetching
// =============================================================================

/**
 * Get complete check-in overview for a veranstaltung
 */
export async function getCheckInOverview(
  veranstaltungId: string
): Promise<CheckInOverview | null> {
  await requirePermission('veranstaltungen:write')

  const supabase = await createClient()

  // Get veranstaltung
  const { data: veranstaltung, error: veranstaltungError } = await supabase
    .from('veranstaltungen')
    .select('id, titel, datum, startzeit, endzeit')
    .eq('id', veranstaltungId)
    .single()

  if (veranstaltungError || !veranstaltung) {
    console.error('Error fetching veranstaltung:', veranstaltungError)
    return null
  }

  // Get zeitbloecke with schichten and zuweisungen
  const { data: zeitbloecke, error: zeitblockError } = await supabase
    .from('zeitbloecke')
    .select(`
      id,
      name,
      startzeit,
      endzeit,
      typ,
      sortierung
    `)
    .eq('veranstaltung_id', veranstaltungId)
    .order('sortierung', { ascending: true })

  if (zeitblockError) {
    console.error('Error fetching zeitbloecke:', zeitblockError)
    return null
  }

  // Get all schichten for this veranstaltung
  const { data: schichten, error: schichtenError } = await supabase
    .from('auffuehrung_schichten')
    .select(`
      id,
      rolle,
      zeitblock_id,
      zuweisungen:auffuehrung_zuweisungen(
        id,
        status,
        checked_in_at,
        checked_in_by,
        no_show,
        person:personen(id, vorname, nachname, telefon, email)
      )
    `)
    .eq('veranstaltung_id', veranstaltungId)

  if (schichtenError) {
    console.error('Error fetching schichten:', schichtenError)
    return null
  }

  // Transform data
  const totalStats = { total: 0, eingecheckt: 0, no_show: 0, erwartet: 0 }

  const transformedZeitbloecke: ZeitblockMitCheckIns[] = (zeitbloecke || []).map(
    (zb) => {
      // Find schichten for this zeitblock
      const zbSchichten = (schichten || []).filter(
        (s) => s.zeitblock_id === zb.id
      )

      // Collect all zuweisungen for this zeitblock
      const zuweisungen: ZuweisungMitCheckIn[] = []
      for (const schicht of zbSchichten) {
        for (const zuweisung of schicht.zuweisungen || []) {
          const person = zuweisung.person as unknown as {
            id: string
            vorname: string
            nachname: string
            telefon: string | null
            email: string | null
          } | null

          if (!person) continue

          const checkinStatus = getCheckInStatus({
            checked_in_at: zuweisung.checked_in_at,
            no_show: zuweisung.no_show,
          })

          zuweisungen.push({
            id: zuweisung.id,
            schicht_id: schicht.id,
            person_id: person.id,
            external_helper_id: null,
            status: zuweisung.status,
            notizen: null,
            abmeldung_token: null,
            checked_in_at: zuweisung.checked_in_at,
            checked_in_by: zuweisung.checked_in_by,
            no_show: zuweisung.no_show,
            ersetzt_zuweisung_id: null,
            ersatz_grund: null,
            feedback_token: null,
            created_at: '',
            person: {
              id: person.id,
              vorname: person.vorname,
              nachname: person.nachname,
              telefon: person.telefon,
              email: person.email,
            },
            schicht: {
              id: schicht.id,
              rolle: schicht.rolle,
              zeitblock: {
                id: zb.id,
                name: zb.name,
                startzeit: zb.startzeit,
                endzeit: zb.endzeit,
              },
            },
            checkin_status: checkinStatus,
          })
        }
      }

      // Calculate stats for this zeitblock
      const stats = {
        total: zuweisungen.length,
        eingecheckt: zuweisungen.filter((z) => z.checkin_status === 'anwesend')
          .length,
        no_show: zuweisungen.filter((z) => z.checkin_status === 'no_show')
          .length,
        erwartet: zuweisungen.filter((z) => z.checkin_status === 'erwartet')
          .length,
      }

      // Add to total stats
      totalStats.total += stats.total
      totalStats.eingecheckt += stats.eingecheckt
      totalStats.no_show += stats.no_show
      totalStats.erwartet += stats.erwartet

      return {
        id: zb.id,
        name: zb.name,
        startzeit: zb.startzeit,
        endzeit: zb.endzeit,
        typ: zb.typ as ZeitblockTyp,
        status: getZeitblockStatus(zb.startzeit, zb.endzeit, veranstaltung.datum),
        zuweisungen,
        stats,
      }
    }
  )

  // Handle schichten without zeitblock
  const orphanSchichten = (schichten || []).filter((s) => !s.zeitblock_id)
  if (orphanSchichten.length > 0) {
    const zuweisungen: ZuweisungMitCheckIn[] = []
    for (const schicht of orphanSchichten) {
      for (const zuweisung of schicht.zuweisungen || []) {
        const person = zuweisung.person as unknown as {
          id: string
          vorname: string
          nachname: string
          telefon: string | null
          email: string | null
        } | null

        if (!person) continue

        const checkinStatus = getCheckInStatus({
          checked_in_at: zuweisung.checked_in_at,
          no_show: zuweisung.no_show,
        })

        zuweisungen.push({
          id: zuweisung.id,
          schicht_id: schicht.id,
          person_id: person.id,
          external_helper_id: null,
          status: zuweisung.status,
          notizen: null,
          abmeldung_token: null,
          checked_in_at: zuweisung.checked_in_at,
          checked_in_by: zuweisung.checked_in_by,
          no_show: zuweisung.no_show,
          ersetzt_zuweisung_id: null,
          ersatz_grund: null,
          feedback_token: null,
          created_at: '',
          person: {
            id: person.id,
            vorname: person.vorname,
            nachname: person.nachname,
            telefon: person.telefon,
            email: person.email,
          },
          schicht: {
            id: schicht.id,
            rolle: schicht.rolle,
            zeitblock: null,
          },
          checkin_status: checkinStatus,
        })
      }
    }

    if (zuweisungen.length > 0) {
      const stats = {
        total: zuweisungen.length,
        eingecheckt: zuweisungen.filter((z) => z.checkin_status === 'anwesend')
          .length,
        no_show: zuweisungen.filter((z) => z.checkin_status === 'no_show')
          .length,
        erwartet: zuweisungen.filter((z) => z.checkin_status === 'erwartet')
          .length,
      }

      totalStats.total += stats.total
      totalStats.eingecheckt += stats.eingecheckt
      totalStats.no_show += stats.no_show
      totalStats.erwartet += stats.erwartet

      transformedZeitbloecke.push({
        id: 'no-zeitblock',
        name: 'Ohne Zeitblock',
        startzeit: veranstaltung.startzeit || '00:00',
        endzeit: veranstaltung.endzeit || '23:59',
        typ: 'standard',
        status: 'aktiv',
        zuweisungen,
        stats,
      })
    }
  }

  return {
    veranstaltung: {
      id: veranstaltung.id,
      titel: veranstaltung.titel,
      datum: veranstaltung.datum,
      startzeit: veranstaltung.startzeit,
      endzeit: veranstaltung.endzeit,
    },
    zeitbloecke: transformedZeitbloecke,
    stats: totalStats,
  }
}

// =============================================================================
// Check-in Actions
// =============================================================================

/**
 * Check in a helper
 */
export async function checkInHelper(
  zuweisungId: string
): Promise<{ success: boolean; error?: string }> {
  await requirePermission('veranstaltungen:write')

  const profile = await getUserProfile()
  if (!profile) {
    return { success: false, error: 'Nicht eingeloggt' }
  }

  const supabase = await createClient()

  // Get the zuweisung to find veranstaltung_id for revalidation
  const { data: zuweisung, error: zuweisungError } = await supabase
    .from('auffuehrung_zuweisungen')
    .select(`
      id,
      checked_in_at,
      schicht:auffuehrung_schichten(veranstaltung_id)
    `)
    .eq('id', zuweisungId)
    .single()

  if (zuweisungError || !zuweisung) {
    return { success: false, error: 'Zuweisung nicht gefunden' }
  }

  if (zuweisung.checked_in_at) {
    return { success: false, error: 'Bereits eingecheckt' }
  }

  // Perform check-in
  const { error } = await supabase
    .from('auffuehrung_zuweisungen')
    .update({
      checked_in_at: new Date().toISOString(),
      checked_in_by: profile.id,
      no_show: false,
    } as never)
    .eq('id', zuweisungId)

  if (error) {
    console.error('Error checking in helper:', error)
    return { success: false, error: 'Fehler beim Einchecken' }
  }

  // Revalidate paths
  const schicht = zuweisung.schicht as unknown as { veranstaltung_id: string } | null
  if (schicht?.veranstaltung_id) {
    revalidatePath(`/auffuehrungen/${schicht.veranstaltung_id}/checkin`)
    revalidatePath(`/auffuehrungen/${schicht.veranstaltung_id}/live-board`)
  }

  return { success: true }
}

/**
 * Mark a helper as no-show
 */
export async function markNoShow(
  zuweisungId: string
): Promise<{ success: boolean; error?: string }> {
  await requirePermission('veranstaltungen:write')

  const supabase = await createClient()

  // Get the zuweisung
  const { data: zuweisung, error: zuweisungError } = await supabase
    .from('auffuehrung_zuweisungen')
    .select(`
      id,
      schicht:auffuehrung_schichten(veranstaltung_id)
    `)
    .eq('id', zuweisungId)
    .single()

  if (zuweisungError || !zuweisung) {
    return { success: false, error: 'Zuweisung nicht gefunden' }
  }

  // Mark as no-show
  const { error } = await supabase
    .from('auffuehrung_zuweisungen')
    .update({
      no_show: true,
      checked_in_at: null,
      checked_in_by: null,
    } as never)
    .eq('id', zuweisungId)

  if (error) {
    console.error('Error marking no-show:', error)
    return { success: false, error: 'Fehler beim Markieren als No-Show' }
  }

  // Revalidate paths
  const schicht = zuweisung.schicht as unknown as { veranstaltung_id: string } | null
  if (schicht?.veranstaltung_id) {
    revalidatePath(`/auffuehrungen/${schicht.veranstaltung_id}/checkin`)
    revalidatePath(`/auffuehrungen/${schicht.veranstaltung_id}/live-board`)
  }

  return { success: true }
}

/**
 * Undo a check-in
 */
export async function undoCheckIn(
  zuweisungId: string
): Promise<{ success: boolean; error?: string }> {
  await requirePermission('veranstaltungen:write')

  const supabase = await createClient()

  // Get the zuweisung
  const { data: zuweisung, error: zuweisungError } = await supabase
    .from('auffuehrung_zuweisungen')
    .select(`
      id,
      schicht:auffuehrung_schichten(veranstaltung_id)
    `)
    .eq('id', zuweisungId)
    .single()

  if (zuweisungError || !zuweisung) {
    return { success: false, error: 'Zuweisung nicht gefunden' }
  }

  // Reset check-in
  const { error } = await supabase
    .from('auffuehrung_zuweisungen')
    .update({
      checked_in_at: null,
      checked_in_by: null,
      no_show: false,
    } as never)
    .eq('id', zuweisungId)

  if (error) {
    console.error('Error undoing check-in:', error)
    return { success: false, error: 'Fehler beim Zuruecksetzen' }
  }

  // Revalidate paths
  const schicht = zuweisung.schicht as unknown as { veranstaltung_id: string } | null
  if (schicht?.veranstaltung_id) {
    revalidatePath(`/auffuehrungen/${schicht.veranstaltung_id}/checkin`)
    revalidatePath(`/auffuehrungen/${schicht.veranstaltung_id}/live-board`)
  }

  return { success: true }
}

/**
 * Bulk check-in multiple helpers at once
 */
export async function bulkCheckIn(
  zuweisungIds: string[]
): Promise<{ success: boolean; error?: string; count?: number }> {
  await requirePermission('veranstaltungen:write')

  const profile = await getUserProfile()
  if (!profile) {
    return { success: false, error: 'Nicht eingeloggt' }
  }

  if (zuweisungIds.length === 0) {
    return { success: true, count: 0 }
  }

  const supabase = await createClient()

  // Perform bulk update
  const { error, count } = await supabase
    .from('auffuehrung_zuweisungen')
    .update({
      checked_in_at: new Date().toISOString(),
      checked_in_by: profile.id,
      no_show: false,
    } as never)
    .in('id', zuweisungIds)
    .is('checked_in_at', null)

  if (error) {
    console.error('Error bulk checking in:', error)
    return { success: false, error: 'Fehler beim Massen-Einchecken' }
  }

  // Get veranstaltung_id from first zuweisung for revalidation
  const { data: firstZuweisung } = await supabase
    .from('auffuehrung_zuweisungen')
    .select('schicht:auffuehrung_schichten(veranstaltung_id)')
    .eq('id', zuweisungIds[0])
    .single()

  const schicht = firstZuweisung?.schicht as unknown as { veranstaltung_id: string } | null
  if (schicht?.veranstaltung_id) {
    revalidatePath(`/auffuehrungen/${schicht.veranstaltung_id}/checkin`)
    revalidatePath(`/auffuehrungen/${schicht.veranstaltung_id}/live-board`)
  }

  return { success: true, count: count || 0 }
}
