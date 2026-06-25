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
 * The veranstaltung.datum is a date-only string (YYYY-MM-DD); we construct a
 * comparable datetime using startzeit for sorting/filtering.
 */
async function normalizeZuweisungen(
  zuweisungen: HelferDashboardZuweisung[]
): Promise<HelferDashboardAnmeldung[]> {
  return zuweisungen.map((z) => {
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
        helper: { vorname: string; nachname: string; email: string; telefon: string | null }
        zuweisungen?: HelferDashboardZuweisung[]
        error?: never
      }
    | { error: string }

  if ('error' in result && result.error) {
    return null
  }

  const rawZuweisungen = (
    result as { zuweisungen?: HelferDashboardZuweisung[] }
  ).zuweisungen ?? []
  const entries = await normalizeZuweisungen(rawZuweisungen)
  const allEntries = await sortAnmeldungen(entries)

  return {
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
    .select('id, vorname, nachname, email, telefon')
    .eq('email', profile.email)
    .single()

  const helper = person
    ? { vorname: person.vorname, nachname: person.nachname, email: person.email ?? profile.email, telefon: person.telefon ?? null }
    : { vorname: profile.display_name ?? profile.email, nachname: '', email: profile.email, telefon: null }

  // System B: Get auffuehrung_zuweisungen for this profile's person
  const personId = person?.id ?? null

  let entries: HelferDashboardAnmeldung[] = []

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
      entries = zuweisungen.map((z) => {
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
        }
      })
    }
  }

  const allEntries = await sortAnmeldungen(entries)

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
