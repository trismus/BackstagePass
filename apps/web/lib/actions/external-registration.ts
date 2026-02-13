'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '../supabase/admin'
import { canRegisterForHelferliste } from './helfer-status'
import { externeHelferRegistrierungSchema } from '../validations/externe-helfer'
import type {
  Veranstaltung,
  AuffuehrungSchicht,
  Zeitblock,
  InfoBlock,
} from '../supabase/types'

// =============================================================================
// Types for Public Access
// =============================================================================

export type PublicVeranstaltungData = Pick<
  Veranstaltung,
  'id' | 'titel' | 'datum' | 'startzeit' | 'endzeit' | 'ort' | 'helfer_status'
>

export type PublicSchichtData = Pick<
  AuffuehrungSchicht,
  'id' | 'rolle' | 'anzahl_benoetigt'
> & {
  zeitblock: Pick<Zeitblock, 'id' | 'name' | 'startzeit' | 'endzeit'> | null
  anzahl_belegt: number
  freie_plaetze: number
}

export type PublicZeitblockData = Pick<
  Zeitblock,
  'id' | 'name' | 'startzeit' | 'endzeit' | 'typ' | 'sortierung'
> & {
  schichten: PublicSchichtData[]
}

export type PublicHelferlisteData = {
  veranstaltung: PublicVeranstaltungData
  zeitbloecke: PublicZeitblockData[]
  infoBloecke: InfoBlock[]
}

export type RegistrationResult = {
  success: boolean
  error?: string
  waitlist?: boolean
}

// =============================================================================
// Token Validation and Data Fetching
// =============================================================================

/**
 * Validate token and get public helferliste data
 * This is called by the public page - no authentication required
 */
export async function getPublicHelferlisteByToken(
  token: string
): Promise<PublicHelferlisteData | { error: string }> {
  // Use admin client for public access (bypasses RLS for reading)
  const supabase = createAdminClient()

  // Validate token and get veranstaltung
  const { data: veranstaltung, error: veranstaltungError } = await supabase
    .from('veranstaltungen')
    .select('id, titel, datum, startzeit, endzeit, ort, helfer_status')
    .eq('public_helfer_token', token)
    .single()

  if (veranstaltungError || !veranstaltung) {
    return { error: 'Ungültiger Link. Bitte überprüfe die URL.' }
  }

  // Check status
  if (veranstaltung.helfer_status !== 'veroeffentlicht') {
    if (veranstaltung.helfer_status === 'abgeschlossen') {
      return { error: 'Die Anmeldung für diese Veranstaltung ist abgeschlossen.' }
    }
    return { error: 'Diese Helferliste ist noch nicht öffentlich verfügbar.' }
  }

  // Check if event is in the past
  const eventDate = new Date(veranstaltung.datum)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (eventDate < today) {
    return { error: 'Diese Veranstaltung hat bereits stattgefunden.' }
  }

  // Get zeitbloecke with public schichten
  const { data: zeitbloecke, error: zeitblockError } = await supabase
    .from('zeitbloecke')
    .select('id, name, startzeit, endzeit, typ, sortierung')
    .eq('veranstaltung_id', veranstaltung.id)
    .order('sortierung', { ascending: true })

  if (zeitblockError) {
    console.error('Error fetching zeitbloecke:', zeitblockError)
    return { error: 'Fehler beim Laden der Daten.' }
  }

  // Get public schichten with assignment counts
  const { data: schichten, error: schichtenError } = await supabase
    .from('auffuehrung_schichten')
    .select(`
      id,
      rolle,
      anzahl_benoetigt,
      zeitblock_id,
      zuweisungen:auffuehrung_zuweisungen(id, status)
    `)
    .eq('veranstaltung_id', veranstaltung.id)
    .eq('sichtbarkeit', 'public')

  if (schichtenError) {
    console.error('Error fetching schichten:', schichtenError)
    return { error: 'Fehler beim Laden der Daten.' }
  }

  // Get info_bloecke
  const { data: infoBloecke, error: infoError } = await supabase
    .from('info_bloecke')
    .select('id, veranstaltung_id, titel, beschreibung, startzeit, endzeit, sortierung, created_at')
    .eq('veranstaltung_id', veranstaltung.id)
    .order('sortierung', { ascending: true })

  if (infoError) {
    console.error('Error fetching info_bloecke:', infoError)
  }

  // Group schichten by zeitblock
  const zeitblockMap = new Map<string | null, PublicSchichtData[]>()

  for (const schicht of schichten || []) {
    const zuweisungen = (schicht.zuweisungen as unknown as { id: string; status: string }[]) || []
    const anzahl_belegt = zuweisungen.filter(z => z.status !== 'abgesagt').length
    const freie_plaetze = Math.max(0, schicht.anzahl_benoetigt - anzahl_belegt)

    const zeitblockId = schicht.zeitblock_id
    const zeitblock = zeitbloecke?.find(zb => zb.id === zeitblockId)

    const schichtData: PublicSchichtData = {
      id: schicht.id,
      rolle: schicht.rolle,
      anzahl_benoetigt: schicht.anzahl_benoetigt,
      zeitblock: zeitblock ? {
        id: zeitblock.id,
        name: zeitblock.name,
        startzeit: zeitblock.startzeit,
        endzeit: zeitblock.endzeit,
      } : null,
      anzahl_belegt,
      freie_plaetze,
    }

    const key = zeitblockId
    if (!zeitblockMap.has(key)) {
      zeitblockMap.set(key, [])
    }
    zeitblockMap.get(key)!.push(schichtData)
  }

  // Build response with grouped schichten
  const transformedZeitbloecke: PublicZeitblockData[] = (zeitbloecke || [])
    .filter(zb => zeitblockMap.has(zb.id))
    .map(zb => ({
      ...zb,
      schichten: zeitblockMap.get(zb.id) || [],
    }))

  // Add schichten without zeitblock if any
  const orphanSchichten = zeitblockMap.get(null)
  if (orphanSchichten && orphanSchichten.length > 0) {
    transformedZeitbloecke.push({
      id: 'ohne-zeitblock',
      name: 'Allgemein',
      startzeit: veranstaltung.startzeit || '00:00',
      endzeit: veranstaltung.endzeit || '23:59',
      typ: 'standard',
      sortierung: 9999,
      schichten: orphanSchichten,
    })
  }

  return {
    veranstaltung: veranstaltung as PublicVeranstaltungData,
    zeitbloecke: transformedZeitbloecke,
    infoBloecke: (infoBloecke || []) as InfoBlock[],
  }
}

// =============================================================================
// External Helper Registration
// =============================================================================

/**
 * Register an external helper for a shift
 * This is called from the public page - uses token validation
 */
export async function registerExternalHelper(
  token: string,
  schichtId: string,
  helperData: {
    email: string
    vorname: string
    nachname: string
    telefon?: string
  }
): Promise<RegistrationResult> {
  // Validate helper data
  const parseResult = externeHelferRegistrierungSchema.safeParse(helperData)
  if (!parseResult.success) {
    const firstIssue = parseResult.error.issues[0]
    return { success: false, error: firstIssue.message }
  }
  const validData = parseResult.data

  const supabase = createAdminClient()

  // Validate token and get veranstaltung
  const { data: veranstaltung, error: veranstaltungError } = await supabase
    .from('veranstaltungen')
    .select('id, helfer_status')
    .eq('public_helfer_token', token)
    .single()

  if (veranstaltungError || !veranstaltung) {
    return { success: false, error: 'Ungültiger Link' }
  }

  // Check if registration is allowed
  const canRegister = await canRegisterForHelferliste(veranstaltung.id, true)
  if (!canRegister.allowed) {
    return { success: false, error: canRegister.reason }
  }

  // Verify schicht exists and is public
  const { data: schicht, error: schichtError } = await supabase
    .from('auffuehrung_schichten')
    .select('id, veranstaltung_id, anzahl_benoetigt, sichtbarkeit')
    .eq('id', schichtId)
    .single()

  if (schichtError || !schicht) {
    return { success: false, error: 'Schicht nicht gefunden' }
  }

  if (schicht.veranstaltung_id !== veranstaltung.id) {
    return { success: false, error: 'Ungültige Schicht' }
  }

  if (schicht.sichtbarkeit !== 'public') {
    return { success: false, error: 'Diese Schicht ist nicht öffentlich verfügbar' }
  }

  // Find or create external helper profile
  const { data: helperId, error: helperError } = await supabase
    .rpc('find_or_create_external_helper', {
      p_email: validData.email,
      p_vorname: validData.vorname,
      p_nachname: validData.nachname,
      p_telefon: validData.telefon || null,
    })

  if (helperError || !helperId) {
    console.error('Error creating helper profile:', helperError)
    return { success: false, error: 'Fehler bei der Registrierung' }
  }

  // Check if already registered for this shift
  const { data: existingZuweisung } = await supabase
    .from('auffuehrung_zuweisungen')
    .select('id')
    .eq('schicht_id', schichtId)
    .eq('external_helper_id', helperId)
    .single()

  if (existingZuweisung) {
    return { success: false, error: 'Du bist bereits für diese Schicht angemeldet' }
  }

  // Check available slots
  const { count: currentCount } = await supabase
    .from('auffuehrung_zuweisungen')
    .select('id', { count: 'exact', head: true })
    .eq('schicht_id', schichtId)
    .neq('status', 'abgesagt')

  const isWaitlist = (currentCount ?? 0) >= schicht.anzahl_benoetigt

  // Create zuweisung
  const { error: insertError } = await supabase
    .from('auffuehrung_zuweisungen')
    .insert({
      schicht_id: schichtId,
      external_helper_id: helperId,
      status: 'zugesagt',
    } as never)

  if (insertError) {
    console.error('Error creating zuweisung:', insertError)
    if (insertError.code === '23505') {
      return { success: false, error: 'Du bist bereits für diese Schicht angemeldet' }
    }
    return { success: false, error: 'Fehler bei der Anmeldung' }
  }

  // Revalidate paths
  revalidatePath(`/helfer/anmeldung/${token}`)

  return { success: true, waitlist: isWaitlist }
}

/**
 * Check if an email is already registered for a schicht
 */
export async function checkExistingRegistration(
  token: string,
  schichtId: string,
  email: string
): Promise<{ registered: boolean }> {
  const supabase = createAdminClient()

  // Find external helper by email
  const { data: helper } = await supabase
    .from('externe_helfer_profile')
    .select('id')
    .ilike('email', email.toLowerCase().trim())
    .single()

  if (!helper) {
    return { registered: false }
  }

  // Check if registered for this schicht
  const { data: zuweisung } = await supabase
    .from('auffuehrung_zuweisungen')
    .select('id')
    .eq('schicht_id', schichtId)
    .eq('external_helper_id', helper.id)
    .neq('status', 'abgesagt')
    .single()

  return { registered: !!zuweisung }
}
