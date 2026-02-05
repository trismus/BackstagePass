'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { sendCancellationConfirmation } from '@/lib/actions/email-sender'
import { processWaitlist } from '@/lib/actions/warteliste'

/**
 * Cancel a registration using the abmeldung_token
 * This is a public action - no authentication required
 */
export async function cancelRegistrationByToken(
  token: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Find the zuweisung by token
  const { data: zuweisung, error: fetchError } = await supabase
    .from('auffuehrung_zuweisungen')
    .select(`
      id,
      status,
      schicht_id,
      schicht:auffuehrung_schichten(veranstaltung_id)
    `)
    .eq('abmeldung_token', token)
    .single()

  if (fetchError || !zuweisung) {
    return { success: false, error: 'Anmeldung nicht gefunden oder Link ungültig' }
  }

  if (zuweisung.status === 'abgesagt') {
    return { success: false, error: 'Diese Anmeldung wurde bereits storniert' }
  }

  const schicht = zuweisung.schicht as unknown as { veranstaltung_id: string } | null
  const veranstaltungId = schicht?.veranstaltung_id

  // Update status to 'abgesagt'
  const { error: updateError } = await supabase
    .from('auffuehrung_zuweisungen')
    .update({ status: 'abgesagt' } as never)
    .eq('id', zuweisung.id)

  if (updateError) {
    console.error('Error cancelling registration:', updateError)
    return { success: false, error: 'Fehler beim Stornieren der Anmeldung' }
  }

  // Send confirmation email (async, don't wait)
  sendCancellationConfirmation(zuweisung.id).catch((err) => {
    console.error('Error sending cancellation email:', err)
  })

  // Process waitlist for this schicht (async, don't wait)
  // This will notify the next person on the waitlist
  processWaitlist(zuweisung.schicht_id).catch((err) => {
    console.error('Error processing waitlist:', err)
  })

  // Revalidate paths
  if (veranstaltungId) {
    revalidatePath(`/auffuehrungen/${veranstaltungId}/helferliste`)
    revalidatePath(`/auffuehrungen/${veranstaltungId}`)
  }

  return { success: true }
}
