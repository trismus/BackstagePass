'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { sendCancellationConfirmation } from '@/lib/actions/email-sender'
import { processWaitlist } from '@/lib/actions/warteliste'
import { withConstantTime } from '@/lib/utils/timing-safe'

/**
 * Cancel a registration using the abmeldung_token
 * This is a public action - no authentication required
 *
 * Security measures:
 * - Constant response time to prevent timing attacks on token lookup
 * - Event date validation to reject cancellations after event has ended
 */
export async function cancelRegistrationByToken(
  token: string
): Promise<{ success: boolean; error?: string }> {
  return withConstantTime(async () => {
    const supabase = await createClient()

    // Find the zuweisung by token, include veranstaltung date for expiry check
    const { data: zuweisung, error: fetchError } = await supabase
      .from('auffuehrung_zuweisungen')
      .select(`
        id,
        status,
        schicht_id,
        schicht:auffuehrung_schichten(
          veranstaltung_id,
          veranstaltung:veranstaltungen(datum, startzeit, endzeit)
        )
      `)
      .eq('abmeldung_token', token)
      .single()

    if (fetchError || !zuweisung) {
      return { success: false, error: 'Anmeldung nicht gefunden oder Link ungültig' }
    }

    if (zuweisung.status === 'abgesagt') {
      return { success: false, error: 'Diese Anmeldung wurde bereits storniert' }
    }

    const schicht = zuweisung.schicht as unknown as {
      veranstaltung_id: string
      veranstaltung: { datum: string; startzeit: string | null; endzeit: string | null } | null
    } | null
    const veranstaltungId = schicht?.veranstaltung_id
    const veranstaltung = schicht?.veranstaltung

    // Check if event has already ended (tokens are implicitly invalid after event)
    if (veranstaltung) {
      const eventEndTime = veranstaltung.endzeit || '23:59:59'
      const eventEnd = new Date(`${veranstaltung.datum}T${eventEndTime}`)
      if (new Date() > eventEnd) {
        return {
          success: false,
          error: 'Die Veranstaltung ist bereits beendet. Eine Abmeldung ist nicht mehr möglich.',
        }
      }
    }

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
  })
}
