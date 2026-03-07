'use server'

import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { getUserProfile } from '@/lib/supabase/server'
import { externeHelferSelfEditSchema } from '@/lib/validations/externe-helfer'
import type {
  HelferDashboardData,
  HelferDashboardAnmeldung,
  HelferDashboardZuweisung,
} from '@/lib/supabase/types'

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Normalize a raw System B zuweisung into a unified HelferDashboardAnmeldung.
 * The veranstaltung.datum is a date-only string (YYYY-MM-DD), while System A
 * uses full timestamps. We construct a comparable datetime using startzeit.
 */
async function normalizeZuweisungen(
  zuweisungen: HelferDashboardZuweisung[]
): Promise<HelferDashboardAnmeldung[]> {
  return zuweisungen.map((z) => {
    // Build a datetime string from datum + startzeit for sorting/filtering
    const datumStart = z.veranstaltung_startzeit
      ? `${z.veranstaltung_datum}T${z.veranstaltung_startzeit}`
      : `${z.veranstaltung_datum}T00:00:00`

    return {
      id: z.id,
      status: z.status,
      abmeldung_token: z.abmeldung_token,
      created_at: z.created_at,
      rolle_name: z.rolle,
      zeitblock_start: z.zeitblock_start,
      zeitblock_end: z.zeitblock_end,
      rollen_instanz_id: z.schicht_id,
      event_id: z.veranstaltung_id,
      event_name: z.veranstaltung_titel,
      event_datum_start: datumStart,
      event_datum_end: datumStart, // System B has no separate end date
      event_ort: z.veranstaltung_ort,
      event_public_token: z.veranstaltung_public_helfer_token ?? '',
      event_abmeldung_frist: z.veranstaltung_helfer_buchung_deadline,
      system: 'b' as const,
    }
  })
}

/**
 * Sort dashboard entries by event start date, then zeitblock start
 */
async function sortAnmeldungen(
  anmeldungen: HelferDashboardAnmeldung[]
): Promise<HelferDashboardAnmeldung[]> {
  return [...anmeldungen].sort((a, b) => {
    const dateCompare = a.event_datum_start.localeCompare(b.event_datum_start)
    if (dateCompare !== 0) return dateCompare
    if (a.zeitblock_start && b.zeitblock_start) {
      return a.zeitblock_start.localeCompare(b.zeitblock_start)
    }
    return a.zeitblock_start ? -1 : 1
  })
}

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
    | {
        helper: { vorname: string; nachname: string; email: string }
        helper: { vorname: string; nachname: string; email: string; telefon: string | null }
        anmeldungen: HelferDashboardAnmeldung[]
        zuweisungen?: HelferDashboardZuweisung[]
        error?: never
      }
    | { error: string }

  if ('error' in result && result.error) {
    return null
  }

  // Tag System A entries
  const systemAEntries: HelferDashboardAnmeldung[] = (
    result as { anmeldungen: HelferDashboardAnmeldung[] }
  ).anmeldungen.map((a) => ({
    ...a,
    system: 'a' as const,
  }))

  // Normalize System B entries
  const rawZuweisungen = (
    result as { zuweisungen?: HelferDashboardZuweisung[] }
  ).zuweisungen ?? []
  const systemBEntries = await normalizeZuweisungen(rawZuweisungen)

  // Merge and sort
  const allEntries = await sortAnmeldungen([
    ...systemAEntries,
    ...systemBEntries,
  ])

  return {
    helper: (result as { helper: { vorname: string; nachname: string; email: string } }).helper,
    helper: (result as { helper: { vorname: string; nachname: string; email: string; telefon: string | null } }).helper,
    anmeldungen: allEntries,
  }
}

export async function getAuthenticatedHelferDashboard(): Promise<HelferDashboardData | null> {
  const profile = await getUserProfile()
  if (!profile) return null

  const supabase = createAdminClient()

  // Get person info for display name
  const { data: person } = await supabase
    .from('personen')
    .select('vorname, nachname, email, telefon')
    .eq('email', profile.email)
    .single()

  const helper = person
    ? { vorname: person.vorname, nachname: person.nachname, email: person.email ?? profile.email, telefon: person.telefon ?? null }
    : { vorname: profile.display_name ?? profile.email, nachname: '', email: profile.email, telefon: null }

  // System A: Get all non-rejected helfer_anmeldungen for this profile
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

  const systemAEntries: HelferDashboardAnmeldung[] = (!error && anmeldungen)
    ? anmeldungen.map((a) => {
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
          system: 'a' as const,
        }
      })
    : []

  // System B: Get auffuehrung_zuweisungen for this profile's person
  // Find the person linked to this profile via email
  const personId = person
    ? await supabase
        .from('personen')
        .select('id')
        .eq('email', profile.email)
        .single()
        .then(({ data: p }) => p?.id ?? null)
    : null

  let systemBEntries: HelferDashboardAnmeldung[] = []

  if (personId) {
    const { data: zuweisungen } = await supabase
      .from('auffuehrung_zuweisungen')
      .select(`
        id,
        status,
        abmeldung_token,
        created_at,
        schicht:auffuehrung_schichten!inner (
          id,
          rolle,
          veranstaltung:veranstaltungen!inner (
            id, titel, datum, startzeit, ort, public_helfer_token, helfer_buchung_deadline
          ),
          zeitblock:zeitbloecke (
            id, name, startzeit, endzeit
          )
        )
      `)
      .eq('person_id', personId)
      .not('status', 'in', '("abgesagt","nicht_erschienen")')

    if (zuweisungen) {
      systemBEntries = zuweisungen.map((z) => {
        const schicht = z.schicht as unknown as {
          id: string
          rolle: string
          veranstaltung: {
            id: string
            titel: string
            datum: string
            startzeit: string | null
            ort: string | null
            public_helfer_token: string | null
            helfer_buchung_deadline: string | null
          }
          zeitblock: {
            id: string
            name: string
            startzeit: string
            endzeit: string
          } | null
        }

        const v = schicht.veranstaltung
        const datumStart = v.startzeit
          ? `${v.datum}T${v.startzeit}`
          : `${v.datum}T00:00:00`

        return {
          id: z.id,
          status: z.status,
          abmeldung_token: z.abmeldung_token,
          created_at: z.created_at,
          rolle_name: schicht.rolle,
          zeitblock_start: schicht.zeitblock?.startzeit ?? null,
          zeitblock_end: schicht.zeitblock?.endzeit ?? null,
          rollen_instanz_id: schicht.id,
          event_id: v.id,
          event_name: v.titel,
          event_datum_start: datumStart,
          event_datum_end: datumStart,
          event_ort: v.ort,
          event_public_token: v.public_helfer_token ?? '',
          event_abmeldung_frist: v.helfer_buchung_deadline,
          system: 'b' as const,
        }
      })
    }
  }

  // Merge and sort
  const allEntries = await sortAnmeldungen([
    ...systemAEntries,
    ...systemBEntries,
  ])

  return { helper, anmeldungen: allEntries }

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
          system: 'a' as const,
        }
      })
    : []

  // System B: Get auffuehrung_zuweisungen for this profile's person
  // Find the person linked to this profile via email
  const personId = person
    ? await supabase
        .from('personen')
        .select('id')
        .eq('email', profile.email)
        .single()
        .then(({ data: p }) => p?.id ?? null)
    : null

  let systemBEntries: HelferDashboardAnmeldung[] = []

  if (personId) {
    const { data: zuweisungen } = await supabase
      .from('auffuehrung_zuweisungen')
      .select(`
        id,
        status,
        abmeldung_token,
        created_at,
        schicht:auffuehrung_schichten!inner (
          id,
          rolle,
          veranstaltung:veranstaltungen!inner (
            id, titel, datum, startzeit, ort, public_helfer_token, helfer_buchung_deadline
          ),
          zeitblock:zeitbloecke (
            id, name, startzeit, endzeit
          )
        )
      `)
      .eq('person_id', personId)
      .not('status', 'in', '("abgesagt","nicht_erschienen")')

    if (zuweisungen) {
      systemBEntries = zuweisungen.map((z) => {
        const schicht = z.schicht as unknown as {
          id: string
          rolle: string
          veranstaltung: {
            id: string
            titel: string
            datum: string
            startzeit: string | null
            ort: string | null
            public_helfer_token: string | null
            helfer_buchung_deadline: string | null
          }
          zeitblock: {
            id: string
            name: string
            startzeit: string
            endzeit: string
          } | null
        }

        const v = schicht.veranstaltung
        const datumStart = v.startzeit
          ? `${v.datum}T${v.startzeit}`
          : `${v.datum}T00:00:00`

        return {
          id: z.id,
          status: z.status,
          abmeldung_token: z.abmeldung_token,
          created_at: z.created_at,
          rolle_name: schicht.rolle,
          zeitblock_start: schicht.zeitblock?.startzeit ?? null,
          zeitblock_end: schicht.zeitblock?.endzeit ?? null,
          rollen_instanz_id: schicht.id,
          event_id: v.id,
          event_name: v.titel,
          event_datum_start: datumStart,
          event_datum_end: datumStart,
          event_ort: v.ort,
          event_public_token: v.public_helfer_token ?? '',
          event_abmeldung_frist: v.helfer_buchung_deadline,
          system: 'b' as const,
        }
      })
    }
  }

  // Merge and sort
  const allEntries = await sortAnmeldungen([
    ...systemAEntries,
    ...systemBEntries,
  ])

  return { helper, anmeldungen: allEntries }
}

export async function updateExterneHelferProfile(
  dashboardToken: string,
  data: { vorname: string; nachname: string; telefon?: string | null }
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    if (!UUID_REGEX.test(dashboardToken)) {
      return { success: false, error: 'Ungültiger Token' }
    }

    const validated = externeHelferSelfEditSchema.parse(data)

    const supabase = createAdminClient()

    // Verify token exists and get the profile
    const { data: profile, error: findError } = await supabase
      .from('externe_helfer_profile')
      .select('id')
      .eq('dashboard_token', dashboardToken)
      .single()

    if (findError || !profile) {
      return { success: false, error: 'Profil nicht gefunden' }
    }

    // Update the profile
    const { error: updateError } = await supabase
      .from('externe_helfer_profile')
      .update({
        vorname: validated.vorname,
        nachname: validated.nachname,
        telefon: validated.telefon ?? null,
      })
      .eq('id', profile.id)

    if (updateError) {
      console.error('Failed to update externe_helfer_profile:', updateError)
      return { success: false, error: 'Profil konnte nicht aktualisiert werden' }
    }

    revalidatePath(`/helfer/meine-einsaetze/${dashboardToken}`)

    return { success: true }
  } catch (error) {
    console.error('updateExterneHelferProfile failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
    }
  }
}
