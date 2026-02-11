'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

/**
 * Cancel a helferliste registration using the abmeldung_token.
 * This is a public action - no authentication required.
 * Deletes the helfer_anmeldungen row (freeing the slot).
 */
export async function cancelHelferlisteRegistration(
  token: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Find the anmeldung by abmeldung_token
  const { data: anmeldung, error: fetchError } = await supabase
    .from('helfer_anmeldungen')
    .select(`
      id,
      status,
      rollen_instanz_id,
      rollen_instanz:helfer_rollen_instanzen(
        helfer_event_id,
        helfer_event:helfer_events(datum_start)
      )
    `)
    .eq('abmeldung_token', token)
    .single()

  if (fetchError || !anmeldung) {
    return { success: false, error: 'Anmeldung nicht gefunden oder Link ungültig' }
  }

  // Check 6-hour rule
  const rollenInstanz = anmeldung.rollen_instanz as unknown as {
    helfer_event_id: string
    helfer_event: { datum_start: string } | null
  } | null

  if (rollenInstanz?.helfer_event?.datum_start) {
    const eventStart = new Date(rollenInstanz.helfer_event.datum_start)
    const now = new Date()
    const hoursUntilEvent = (eventStart.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (hoursUntilEvent < 6) {
      return {
        success: false,
        error: 'Die Veranstaltung beginnt in weniger als 6 Stunden. Eine Online-Abmeldung ist nicht mehr möglich.',
      }
    }
  }

  // Delete the registration (frees the slot)
  const { error: deleteError } = await supabase
    .from('helfer_anmeldungen')
    .delete()
    .eq('id', anmeldung.id)

  if (deleteError) {
    console.error('Error cancelling helferliste registration:', deleteError)
    return { success: false, error: 'Fehler beim Stornieren der Anmeldung' }
  }

  // Revalidate paths
  revalidatePath('/helferliste')
  if (rollenInstanz?.helfer_event_id) {
    revalidatePath(`/helferliste/${rollenInstanz.helfer_event_id}`)
  }

  return { success: true }
}
