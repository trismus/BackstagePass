'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../supabase/server'
import { createAdminClient } from '../supabase/admin'
import { requirePermission, getUserProfile } from '../supabase/auth-helpers'
import type {
  Sachleistung,
  SachleistungInsert,
  SachleistungUpdate,
  SachleistungMitZusagen,
  SachleistungZusage,
  ZusageMitName,
  SachleistungenSummaryData,
} from '../supabase/types'
import {
  sachleistungSchema,
  sachleistungUpdateSchema,
  internZusageSchema,
  externZusageSchema,
  validateInput,
} from '../validations/modul2'

// =============================================================================
// Revalidation Helper
// =============================================================================

function revalidateSachleistungen(veranstaltungId: string) {
  revalidatePath(`/auffuehrungen/${veranstaltungId}`)
  revalidatePath('/auffuehrungen')
  revalidatePath('/mitmachen')
  revalidatePath('/vorstand/helferliste')
}

// =============================================================================
// Instance-Level CRUD (for management)
// =============================================================================

/**
 * Add a sachleistung to a specific veranstaltung
 */
export async function addSachleistung(
  data: SachleistungInsert
): Promise<{ success: boolean; error?: string; id?: string }> {
  try { await requirePermission('helferliste:write') }
  catch { return { success: false, error: 'Keine Berechtigung' } }

  const validation = validateInput(sachleistungSchema, data)
  if (!validation.success) {
    return { success: false, error: validation.error }
  }

  const supabase = await createClient()
  const { data: result, error } = await supabase
    .from('sachleistungen')
    .insert(validation.data as never)
    .select('id')
    .single()

  if (error) {
    console.error('Error adding sachleistung:', error)
    return { success: false, error: 'Fehler beim Hinzufügen der Sachleistung' }
  }

  revalidateSachleistungen(data.veranstaltung_id)
  return { success: true, id: result?.id }
}

/**
 * Update an existing sachleistung
 */
export async function updateSachleistung(
  id: string,
  veranstaltungId: string,
  data: SachleistungUpdate
): Promise<{ success: boolean; error?: string }> {
  try { await requirePermission('helferliste:write') }
  catch { return { success: false, error: 'Keine Berechtigung' } }

  const validation = validateInput(sachleistungUpdateSchema, data)
  if (!validation.success) {
    return { success: false, error: validation.error }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('sachleistungen')
    .update(validation.data as never)
    .eq('id', id)

  if (error) {
    console.error('Error updating sachleistung:', error)
    return { success: false, error: 'Fehler beim Aktualisieren der Sachleistung' }
  }

  revalidateSachleistungen(veranstaltungId)
  return { success: true }
}

/**
 * Remove a sachleistung (also cascades to its zusagen)
 */
export async function removeSachleistung(
  id: string,
  veranstaltungId: string
): Promise<{ success: boolean; error?: string }> {
  try { await requirePermission('helferliste:write') }
  catch { return { success: false, error: 'Keine Berechtigung' } }

  const supabase = await createClient()
  const { error } = await supabase
    .from('sachleistungen')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error removing sachleistung:', error)
    return { success: false, error: error.message }
  }

  revalidateSachleistungen(veranstaltungId)
  return { success: true }
}

// =============================================================================
// Fetching with Zusagen
// =============================================================================

/**
 * Get all sachleistungen with their zusagen for admin/management view.
 * Includes person names resolved from person_id.
 */
export async function getSachleistungenMitZusagen(
  veranstaltungId: string
): Promise<SachleistungMitZusagen[]> {
  await requirePermission('helferliste:read')
  const supabase = await createClient()

  const { data: sachleistungen, error } = await supabase
    .from('sachleistungen')
    .select('*')
    .eq('veranstaltung_id', veranstaltungId)

  if (error || !sachleistungen) {
    console.error('Error fetching sachleistungen:', error)
    return []
  }

  if (sachleistungen.length === 0) return []

  const sachleistungIds = sachleistungen.map((s) => s.id)

  // Fetch all zusagen for these sachleistungen
  const { data: zusagen, error: zusagenError } = await supabase
    .from('sachleistung_zusagen')
    .select(`
      *,
      person:personen(id, vorname, nachname, email, telefon)
    `)
    .in('sachleistung_id', sachleistungIds)

  if (zusagenError) {
    console.error('Error fetching zusagen:', zusagenError)
  }

  const allZusagen = (zusagen || []) as unknown as (SachleistungZusage & {
    person: { id: string; vorname: string; nachname: string; email: string | null; telefon: string | null } | null
  })[]

  return sachleistungen.map((sl) => {
    const slZusagen = allZusagen
      .filter((z) => z.sachleistung_id === sl.id)
      .map((z) => ({
        id: z.id,
        sachleistung_id: z.sachleistung_id,
        person_id: z.person_id,
        external_name: z.external_name,
        external_email: z.external_email,
        external_telefon: z.external_telefon,
        anzahl: z.anzahl,
        kommentar: z.kommentar,
        status: z.status,
        geliefert_at: z.geliefert_at,
        created_at: z.created_at,
      })) as SachleistungZusage[]

    const activeZusagen = slZusagen.filter((z) => z.status !== 'storniert')
    const zugesagt_anzahl = activeZusagen.reduce((sum, z) => sum + z.anzahl, 0)
    const geliefert_anzahl = slZusagen
      .filter((z) => z.status === 'geliefert')
      .reduce((sum, z) => sum + z.anzahl, 0)

    return {
      ...(sl as Sachleistung),
      zusagen: slZusagen,
      zugesagt_anzahl,
      geliefert_anzahl,
      offen_anzahl: Math.max(0, sl.anzahl - zugesagt_anzahl),
    }
  })
}

/**
 * Get public sachleistungen for the mitmach page.
 * Only returns items with sichtbarkeit = 'public'.
 * Uses admin client since this is called without authentication.
 */
export async function getPublicSachleistungen(
  veranstaltungId: string
): Promise<SachleistungMitZusagen[]> {
  const supabase = createAdminClient()

  const { data: sachleistungen, error } = await supabase
    .from('sachleistungen')
    .select('*')
    .eq('veranstaltung_id', veranstaltungId)
    .eq('sichtbarkeit', 'public')

  if (error || !sachleistungen) {
    console.error('Error fetching public sachleistungen:', error)
    return []
  }

  if (sachleistungen.length === 0) return []

  const sachleistungIds = sachleistungen.map((s) => s.id)

  // Fetch zusagen counts (no personal data for public view)
  const { data: zusagen, error: zusagenError } = await supabase
    .from('sachleistung_zusagen')
    .select('id, sachleistung_id, anzahl, status')
    .in('sachleistung_id', sachleistungIds)

  if (zusagenError) {
    console.error('Error fetching public zusagen:', zusagenError)
  }

  const allZusagen = (zusagen || []) as Pick<SachleistungZusage, 'id' | 'sachleistung_id' | 'anzahl' | 'status'>[]

  return sachleistungen.map((sl) => {
    const slZusagen = allZusagen.filter((z) => z.sachleistung_id === sl.id)
    const activeZusagen = slZusagen.filter((z) => z.status !== 'storniert')
    const zugesagt_anzahl = activeZusagen.reduce((sum, z) => sum + z.anzahl, 0)
    const geliefert_anzahl = slZusagen
      .filter((z) => z.status === 'geliefert')
      .reduce((sum, z) => sum + z.anzahl, 0)

    return {
      ...(sl as Sachleistung),
      zusagen: [], // Don't expose individual pledges publicly
      zugesagt_anzahl,
      geliefert_anzahl,
      offen_anzahl: Math.max(0, sl.anzahl - zugesagt_anzahl),
    }
  })
}

/**
 * Get sachleistungen summary for dashboard compact view.
 * Uses admin client for batch fetching across multiple veranstaltungen.
 */
export async function getSachleistungenSummary(
  veranstaltungId: string
): Promise<SachleistungenSummaryData> {
  const supabase = await createClient()

  const { data: sachleistungen } = await supabase
    .from('sachleistungen')
    .select('id, anzahl')
    .eq('veranstaltung_id', veranstaltungId)

  if (!sachleistungen || sachleistungen.length === 0) {
    return { total: 0, zugesagt: 0, offen: 0, geliefert: 0 }
  }

  const sachleistungIds = sachleistungen.map((s) => s.id)
  const totalBenötigt = sachleistungen.reduce((sum, s) => sum + s.anzahl, 0)

  const { data: zusagen } = await supabase
    .from('sachleistung_zusagen')
    .select('sachleistung_id, anzahl, status')
    .in('sachleistung_id', sachleistungIds)

  const activeZusagen = (zusagen || []).filter((z) => z.status !== 'storniert')
  const zugesagt = activeZusagen.reduce((sum, z) => sum + z.anzahl, 0)
  const geliefert = (zusagen || [])
    .filter((z) => z.status === 'geliefert')
    .reduce((sum, z) => sum + z.anzahl, 0)

  return {
    total: totalBenötigt,
    zugesagt,
    offen: Math.max(0, totalBenötigt - zugesagt),
    geliefert,
  }
}

// =============================================================================
// Zusagen (Pledges) CRUD
// =============================================================================

/**
 * Create a pledge for an internal helper (logged-in user).
 */
export async function sachleistungZusagenIntern(
  data: { sachleistung_id: string; anzahl: number; kommentar?: string | null }
): Promise<{ success: boolean; error?: string }> {
  const profile = await getUserProfile()
  if (!profile) {
    return { success: false, error: 'Nicht eingeloggt' }
  }

  const validation = validateInput(internZusageSchema, data)
  if (!validation.success) {
    return { success: false, error: validation.error }
  }

  const supabase = await createClient()

  // Get person_id from profile
  const { data: person } = await supabase
    .from('personen')
    .select('id')
    .eq('profile_id', profile.id)
    .single()

  if (!person) {
    return { success: false, error: 'Kein Personenprofil gefunden' }
  }

  // Get veranstaltung_id for revalidation
  const { data: sachleistung } = await supabase
    .from('sachleistungen')
    .select('veranstaltung_id')
    .eq('id', validation.data.sachleistung_id)
    .single()

  if (!sachleistung) {
    return { success: false, error: 'Sachleistung nicht gefunden' }
  }

  const { error } = await supabase
    .from('sachleistung_zusagen')
    .insert({
      sachleistung_id: validation.data.sachleistung_id,
      person_id: person.id,
      anzahl: validation.data.anzahl,
      kommentar: validation.data.kommentar || null,
      status: 'zugesagt',
    } as never)

  if (error) {
    console.error('Error creating zusage:', error)
    return { success: false, error: 'Fehler beim Erstellen der Zusage' }
  }

  revalidateSachleistungen(sachleistung.veranstaltung_id)
  return { success: true }
}

/**
 * Create a pledge for an external helper (mitmach page, no auth required).
 * Uses admin client since external helpers are not authenticated.
 */
export async function sachleistungZusagenExtern(
  data: {
    sachleistung_id: string
    external_name: string
    external_email: string
    external_telefon?: string
    anzahl: number
    kommentar?: string | null
  }
): Promise<{ success: boolean; error?: string }> {
  const validation = validateInput(externZusageSchema, data)
  if (!validation.success) {
    return { success: false, error: validation.error }
  }

  const supabase = createAdminClient()

  // Get veranstaltung_id for revalidation
  const { data: sachleistung } = await supabase
    .from('sachleistungen')
    .select('veranstaltung_id')
    .eq('id', validation.data.sachleistung_id)
    .single()

  if (!sachleistung) {
    return { success: false, error: 'Sachleistung nicht gefunden' }
  }

  const { error } = await supabase
    .from('sachleistung_zusagen')
    .insert({
      sachleistung_id: validation.data.sachleistung_id,
      external_name: validation.data.external_name,
      external_email: validation.data.external_email,
      external_telefon: validation.data.external_telefon || null,
      anzahl: validation.data.anzahl,
      kommentar: validation.data.kommentar || null,
      status: 'zugesagt',
    } as never)

  if (error) {
    console.error('Error creating external zusage:', error)
    return { success: false, error: 'Fehler beim Erstellen der Zusage' }
  }

  revalidateSachleistungen(sachleistung.veranstaltung_id)
  return { success: true }
}

/**
 * Cancel (stornieren) a pledge.
 * Management can cancel any, users can cancel their own.
 */
export async function sachleistungStornieren(
  zusageId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Fetch the zusage to get veranstaltung_id
  const { data: zusage } = await supabase
    .from('sachleistung_zusagen')
    .select('id, sachleistung_id, sachleistung:sachleistungen(veranstaltung_id)')
    .eq('id', zusageId)
    .single()

  if (!zusage) {
    return { success: false, error: 'Zusage nicht gefunden' }
  }

  const { error } = await supabase
    .from('sachleistung_zusagen')
    .update({ status: 'storniert' } as never)
    .eq('id', zusageId)

  if (error) {
    console.error('Error cancelling zusage:', error)
    return { success: false, error: 'Fehler beim Stornieren der Zusage' }
  }

  const veranstaltungId = (zusage.sachleistung as unknown as { veranstaltung_id: string })?.veranstaltung_id
  if (veranstaltungId) {
    revalidateSachleistungen(veranstaltungId)
  }

  return { success: true }
}

/**
 * Mark a pledge as delivered.
 * Only management can do this.
 */
export async function sachleistungGeliefert(
  zusageId: string
): Promise<{ success: boolean; error?: string }> {
  try { await requirePermission('helferliste:write') }
  catch { return { success: false, error: 'Keine Berechtigung' } }

  const supabase = await createClient()

  // Fetch the zusage for revalidation
  const { data: zusage } = await supabase
    .from('sachleistung_zusagen')
    .select('id, sachleistung_id, sachleistung:sachleistungen(veranstaltung_id)')
    .eq('id', zusageId)
    .single()

  if (!zusage) {
    return { success: false, error: 'Zusage nicht gefunden' }
  }

  const { error } = await supabase
    .from('sachleistung_zusagen')
    .update({
      status: 'geliefert',
      geliefert_at: new Date().toISOString(),
    } as never)
    .eq('id', zusageId)

  if (error) {
    console.error('Error marking zusage as delivered:', error)
    return { success: false, error: 'Fehler beim Markieren als geliefert' }
  }

  const veranstaltungId = (zusage.sachleistung as unknown as { veranstaltung_id: string })?.veranstaltung_id
  if (veranstaltungId) {
    revalidateSachleistungen(veranstaltungId)
  }

  return { success: true }
}

/**
 * Revert a delivered pledge back to "zugesagt".
 * Only management can do this.
 */
export async function sachleistungNichtGeliefert(
  zusageId: string
): Promise<{ success: boolean; error?: string }> {
  try { await requirePermission('helferliste:write') }
  catch { return { success: false, error: 'Keine Berechtigung' } }

  const supabase = await createClient()

  const { data: zusage } = await supabase
    .from('sachleistung_zusagen')
    .select('id, sachleistung_id, sachleistung:sachleistungen(veranstaltung_id)')
    .eq('id', zusageId)
    .single()

  if (!zusage) {
    return { success: false, error: 'Zusage nicht gefunden' }
  }

  const { error } = await supabase
    .from('sachleistung_zusagen')
    .update({
      status: 'zugesagt',
      geliefert_at: null,
    } as never)
    .eq('id', zusageId)

  if (error) {
    console.error('Error reverting zusage status:', error)
    return { success: false, error: 'Fehler beim Zurücksetzen des Status' }
  }

  const veranstaltungId = (zusage.sachleistung as unknown as { veranstaltung_id: string })?.veranstaltung_id
  if (veranstaltungId) {
    revalidateSachleistungen(veranstaltungId)
  }

  return { success: true }
}

/**
 * Get zusagen with resolved names for management tracking view.
 */
export async function getZusagenMitNamen(
  sachleistungId: string
): Promise<ZusageMitName[]> {
  await requirePermission('helferliste:read')
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('sachleistung_zusagen')
    .select(`
      *,
      person:personen(vorname, nachname, email, telefon)
    `)
    .eq('sachleistung_id', sachleistungId)
    .order('created_at', { ascending: true })

  if (error || !data) {
    console.error('Error fetching zusagen mit namen:', error)
    return []
  }

  return (data as unknown as (SachleistungZusage & {
    person: { vorname: string; nachname: string; email: string | null; telefon: string | null } | null
  })[]).map((z) => {
    const person = Array.isArray(z.person) ? z.person[0] : z.person

    return {
      ...z,
      person: undefined,
      helfer_name: person
        ? `${person.vorname} ${person.nachname}`
        : z.external_name || 'Unbekannt',
      helfer_email: person?.email || z.external_email || null,
      helfer_telefon: person?.telefon || z.external_telefon || null,
    } as ZusageMitName
  })
}
