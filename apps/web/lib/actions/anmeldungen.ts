'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../supabase/server'
import type {
  Anmeldung,
  AnmeldungMitPerson,
  AnmeldungMitVeranstaltung,
  AnmeldungStatus,
} from '../supabase/types'
import { getVeranstaltung, getAnmeldungCount } from './veranstaltungen'

/**
 * Register for a veranstaltung
 * Handles max participants and waitlist logic
 */
export async function anmelden(
  veranstaltungId: string,
  personId: string,
  notizen?: string
): Promise<{ success: boolean; error?: string; status?: AnmeldungStatus }> {
  const supabase = await createClient()

  // Check if already registered
  const { data: existing } = await supabase
    .from('anmeldungen')
    .select('id, status')
    .eq('veranstaltung_id', veranstaltungId)
    .eq('person_id', personId)
    .single()

  if (existing && existing.status !== 'abgemeldet') {
    return { success: false, error: 'Bereits angemeldet' }
  }

  // Get event details for capacity check
  const veranstaltung = await getVeranstaltung(veranstaltungId)
  if (!veranstaltung) {
    return { success: false, error: 'Veranstaltung nicht gefunden' }
  }

  if (veranstaltung.status === 'abgesagt') {
    return { success: false, error: 'Veranstaltung wurde abgesagt' }
  }

  // Determine registration status
  let status: AnmeldungStatus = 'angemeldet'
  if (veranstaltung.max_teilnehmer) {
    const currentCount = await getAnmeldungCount(veranstaltungId)
    if (currentCount >= veranstaltung.max_teilnehmer) {
      if (veranstaltung.warteliste_aktiv) {
        status = 'warteliste'
      } else {
        return { success: false, error: 'Veranstaltung ist voll' }
      }
    }
  }

  // Insert or update registration
  if (existing) {
    // Re-register (was previously abgemeldet)
    const { error } = await supabase
      .from('anmeldungen')
      .update({
        status,
        notizen,
        anmeldedatum: new Date().toISOString(),
      } as never)
      .eq('id', existing.id)

    if (error) {
      console.error('Error updating anmeldung:', error)
      return { success: false, error: error.message }
    }
  } else {
    // New registration
    const { error } = await supabase.from('anmeldungen').insert({
      veranstaltung_id: veranstaltungId,
      person_id: personId,
      status,
      notizen,
    } as never)

    if (error) {
      console.error('Error creating anmeldung:', error)
      return { success: false, error: error.message }
    }
  }

  revalidatePath('/veranstaltungen')
  revalidatePath(`/veranstaltungen/${veranstaltungId}`)
  revalidatePath('/mein-bereich')
  return { success: true, status }
}

/**
 * Unregister from a veranstaltung
 */
export async function abmelden(
  veranstaltungId: string,
  personId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('anmeldungen')
    .update({ status: 'abgemeldet' } as never)
    .eq('veranstaltung_id', veranstaltungId)
    .eq('person_id', personId)

  if (error) {
    console.error('Error abmelden:', error)
    return { success: false, error: error.message }
  }

  // TODO: Promote from waitlist if applicable

  revalidatePath('/veranstaltungen')
  revalidatePath(`/veranstaltungen/${veranstaltungId}`)
  revalidatePath('/mein-bereich')
  return { success: true }
}

/**
 * Get all registrations for a veranstaltung with person details
 */
export async function getAnmeldungenForEvent(
  veranstaltungId: string
): Promise<AnmeldungMitPerson[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('anmeldungen')
    .select(
      `
      *,
      person:personen!anmeldungen_person_id_fkey(id, vorname, nachname, email)
    `
    )
    .eq('veranstaltung_id', veranstaltungId)
    .neq('status', 'abgemeldet')
    .order('anmeldedatum', { ascending: true })

  if (error) {
    console.error('Error fetching anmeldungen:', error)
    return []
  }

  return (data as AnmeldungMitPerson[]) || []
}

/**
 * Get all registrations for a person with event details
 */
export async function getAnmeldungenForPerson(
  personId: string
): Promise<AnmeldungMitVeranstaltung[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('anmeldungen')
    .select(
      `
      *,
      veranstaltung:veranstaltungen!anmeldungen_veranstaltung_id_fkey(id, titel, datum, ort, typ)
    `
    )
    .eq('person_id', personId)
    .neq('status', 'abgemeldet')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching anmeldungen for person:', error)
    return []
  }

  return (data as AnmeldungMitVeranstaltung[]) || []
}

/**
 * Update registration status (e.g., mark as teilgenommen)
 * Requires EDITOR or ADMIN role
 */
export async function updateAnmeldungStatus(
  id: string,
  status: AnmeldungStatus
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('anmeldungen')
    .update({ status } as never)
    .eq('id', id)

  if (error) {
    console.error('Error updating anmeldung status:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/veranstaltungen')
  return { success: true }
}

/**
 * Get registration for a specific person and event
 */
export async function getAnmeldung(
  veranstaltungId: string,
  personId: string
): Promise<Anmeldung | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('anmeldungen')
    .select('id, veranstaltung_id, person_id, status, anmeldedatum, notizen, absage_grund, created_at, updated_at')
    .eq('veranstaltung_id', veranstaltungId)
    .eq('person_id', personId)
    .single()

  if (error) {
    return null
  }

  return data as Anmeldung
}
