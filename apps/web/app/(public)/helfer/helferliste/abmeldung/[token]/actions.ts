'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  notifyCancellationConfirmed,
  notifyWaitlistPromotion,
} from '@/lib/actions/helferliste-notifications'

/**
 * Cancel a helferliste registration using the abmeldung_token.
 * This is a public action - no authentication required.
 * Deletes the helfer_anmeldungen row, promotes waitlisted entry if applicable,
 * and sends confirmation + promotion emails.
 */
export async function cancelHelferlisteRegistration(
  token: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // 1. Fetch anmeldung with all needed data (before delete)
  const { data: anmeldung, error: fetchError } = await supabase
    .from('helfer_anmeldungen')
    .select(`
      id,
      status,
      rollen_instanz_id,
      profile_id,
      external_helper_id,
      external_name,
      external_email,
      rollen_instanz:helfer_rollen_instanzen(
        helfer_event_id,
        zeitblock_start,
        zeitblock_end,
        template:helfer_rollen_templates(name),
        helfer_event:helfer_events(name, datum_start, ort, abmeldung_frist)
      ),
      profile:profiles(email, display_name)
    `)
    .eq('abmeldung_token', token)
    .single()

  if (fetchError || !anmeldung) {
    return { success: false, error: 'Anmeldung nicht gefunden oder Link ungültig' }
  }

  // 2. Extract nested data
  const rollenInstanz = anmeldung.rollen_instanz as unknown as {
    helfer_event_id: string
    zeitblock_start: string | null
    zeitblock_end: string | null
    template: { name: string } | null
    helfer_event: {
      name: string
      datum_start: string
      ort: string | null
      abmeldung_frist: string | null
    } | null
  } | null

  const helferEvent = rollenInstanz?.helfer_event

  // 3. Check deadline (configurable abmeldung_frist, fallback to 6-hour rule)
  if (helferEvent) {
    const now = new Date()

    if (helferEvent.abmeldung_frist) {
      const frist = new Date(helferEvent.abmeldung_frist)
      if (now > frist) {
        return {
          success: false,
          error: 'Die Abmeldefrist für diese Veranstaltung ist abgelaufen. Eine Online-Abmeldung ist nicht mehr möglich.',
        }
      }
    } else {
      const eventStart = new Date(helferEvent.datum_start)
      const hoursUntilEvent = (eventStart.getTime() - now.getTime()) / (1000 * 60 * 60)
      if (hoursUntilEvent < 6) {
        return {
          success: false,
          error: 'Die Veranstaltung beginnt in weniger als 6 Stunden. Eine Online-Abmeldung ist nicht mehr möglich.',
        }
      }
    }
  }

  // 4. Resolve contact info BEFORE deleting the row
  let recipientEmail: string | null = null
  let recipientName = 'Helfer'

  const profileData = anmeldung.profile as unknown as {
    email: string
    display_name: string
  } | null

  if (profileData?.email) {
    recipientEmail = profileData.email
    recipientName = profileData.display_name || 'Helfer'
  } else if (anmeldung.external_helper_id) {
    const { data: helper } = await supabase
      .from('externe_helfer_profile')
      .select('email, vorname, nachname')
      .eq('id', anmeldung.external_helper_id)
      .single()

    if (helper?.email) {
      recipientEmail = helper.email
      recipientName = `${helper.vorname} ${helper.nachname}`
    }
  } else if (anmeldung.external_email) {
    recipientEmail = anmeldung.external_email
    recipientName = anmeldung.external_name || 'Helfer'
  }

  // 5. Delete the registration (frees the slot)
  const { error: deleteError } = await supabase
    .from('helfer_anmeldungen')
    .delete()
    .eq('id', anmeldung.id)

  if (deleteError) {
    console.error('Error cancelling helferliste registration:', deleteError)
    return { success: false, error: 'Fehler beim Stornieren der Anmeldung' }
  }

  // 6. Waitlist auto-promotion (if a slot was freed by an active registration)
  let promotedAnmeldungId: string | null = null
  const wasActiveRegistration = anmeldung.status !== 'abgelehnt'

  if (wasActiveRegistration && anmeldung.rollen_instanz_id) {
    const { data: promotedId } = await supabase.rpc('promote_helfer_waitlist', {
      p_rollen_instanz_id: anmeldung.rollen_instanz_id,
    })
    promotedAnmeldungId = (promotedId as string) || null
  }

  // 7. Fire-and-forget emails
  if (recipientEmail && helferEvent) {
    notifyCancellationConfirmed({
      recipientEmail,
      recipientName,
      eventName: helferEvent.name,
      eventDatumStart: helferEvent.datum_start,
      eventOrt: helferEvent.ort,
      rolleName: rollenInstanz?.template?.name || null,
      zeitblockStart: rollenInstanz?.zeitblock_start || null,
      zeitblockEnd: rollenInstanz?.zeitblock_end || null,
    }).catch(console.error)
  }

  if (promotedAnmeldungId) {
    notifyWaitlistPromotion(promotedAnmeldungId).catch(console.error)
  }

  // 8. Revalidate paths
  revalidatePath('/helferliste')
  if (rollenInstanz?.helfer_event_id) {
    revalidatePath(`/helferliste/${rollenInstanz.helfer_event_id}`)
  }

  return { success: true }
}
