'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getUserProfile } from '@/lib/supabase/server'
import type { HelferDashboardData } from '@/lib/supabase/types'

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function getHelferDashboardData(
  dashboardToken: string
): Promise<HelferDashboardData | null> {
  if (!UUID_REGEX.test(dashboardToken)) {
    return null
  }

  const supabase = createAdminClient()

  const { data, error } = await supabase.rpc('get_helfer_dashboard_data', {
    p_dashboard_token: dashboardToken,
  })

  if (error || !data) {
    return null
  }

  const result = data as unknown as
    | HelferDashboardData
    | { error: string }

  if ('error' in result) {
    return null
  }

  return result
}

export async function getAuthenticatedHelferDashboard(): Promise<HelferDashboardData | null> {
  const profile = await getUserProfile()
  if (!profile) return null

  const supabase = createAdminClient()

  // Get person info for display name
  const { data: person } = await supabase
    .from('personen')
    .select('vorname, nachname, email')
    .eq('email', profile.email)
    .single()

  const helper = person
    ? { vorname: person.vorname, nachname: person.nachname, email: person.email ?? profile.email }
    : { vorname: profile.display_name ?? profile.email, nachname: '', email: profile.email }

  // Get all non-rejected registrations for this profile
  const { data: anmeldungen, error } = await supabase
    .from('helfer_anmeldungen')
    .select(`
      id,
      status,
      abmeldung_token,
      created_at,
      rollen_instanz_id,
      helfer_rollen_instanzen!inner (
        id,
        custom_name,
        zeitblock_start,
        zeitblock_end,
        template_id,
        helfer_event_id,
        helfer_rollen_templates ( name ),
        helfer_events!inner (
          id, name, datum_start, datum_end, ort, public_token, abmeldung_frist
        )
      )
    `)
    .eq('profile_id', profile.id)
    .neq('status', 'abgelehnt')

  if (error || !anmeldungen) {
    return { helper, anmeldungen: [] }
  }

  const mapped = anmeldungen.map((a) => {
    const instanz = a.helfer_rollen_instanzen as unknown as {
      id: string
      custom_name: string | null
      zeitblock_start: string | null
      zeitblock_end: string | null
      helfer_rollen_templates: { name: string } | null
      helfer_events: {
        id: string
        name: string
        datum_start: string
        datum_end: string
        ort: string | null
        public_token: string
        abmeldung_frist: string | null
      }
    }

    return {
      id: a.id,
      status: a.status,
      abmeldung_token: a.abmeldung_token,
      created_at: a.created_at,
      rolle_name: instanz.helfer_rollen_templates?.name ?? instanz.custom_name ?? 'Helfer',
      zeitblock_start: instanz.zeitblock_start,
      zeitblock_end: instanz.zeitblock_end,
      rollen_instanz_id: instanz.id,
      event_id: instanz.helfer_events.id,
      event_name: instanz.helfer_events.name,
      event_datum_start: instanz.helfer_events.datum_start,
      event_datum_end: instanz.helfer_events.datum_end,
      event_ort: instanz.helfer_events.ort,
      event_public_token: instanz.helfer_events.public_token,
      event_abmeldung_frist: instanz.helfer_events.abmeldung_frist,
    }
  })

  // Sort by event start date, then zeitblock start
  mapped.sort((a, b) => {
    const dateCompare = a.event_datum_start.localeCompare(b.event_datum_start)
    if (dateCompare !== 0) return dateCompare
    if (a.zeitblock_start && b.zeitblock_start) {
      return a.zeitblock_start.localeCompare(b.zeitblock_start)
    }
    return a.zeitblock_start ? -1 : 1
  })

  return { helper, anmeldungen: mapped }
}
