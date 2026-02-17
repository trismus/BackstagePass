'use server'

import { createClient, getUserProfile } from '../supabase/server'
import { requirePermission } from '../supabase/auth-helpers'
import type {
  Veranstaltung,
  Probe,
  Anmeldung,
  ProbeTeilnehmer,
  AuffuehrungZuweisung,
  TeilnehmerStatus,
  VerfuegbarkeitStatus,
} from '../supabase/types'

// =============================================================================
// Types
// =============================================================================

export type PersonalEventTyp =
  | 'veranstaltung'
  | 'probe'
  | 'schicht'
  | 'helfer'
  | 'helfereinsatz_legacy'

export type PersonalEventStatus =
  | 'angemeldet'
  | 'warteliste'
  | 'eingeladen'
  | 'zugesagt'
  | 'abgesagt'
  | 'abgemeldet'
  | 'erschienen'
  | 'bestaetigt'
  | 'abgelehnt'
  | 'nicht_erschienen'

export type PersonalEvent = {
  id: string
  titel: string
  beschreibung: string | null
  datum: string
  startzeit: string | null
  endzeit: string | null
  ort: string | null
  typ: PersonalEventTyp
  status: PersonalEventStatus
  // References
  veranstaltung_id?: string | null
  probe_id?: string | null
  schicht_id?: string | null
  anmeldung_id?: string | null
  teilnehmer_id?: string | null
  zuweisung_id?: string | null
  helfer_anmeldung_id?: string | null
  helferschicht_id?: string | null
  helfer_event_id?: string | null
  helfereinsatz_id?: string | null
  helfer_rolle?: string | null
  // Extra info
  stueck_titel?: string | null
  rolle?: string | null
  zeitblock?: string | null
  // Actions
  kann_zusagen: boolean
  kann_absagen: boolean
}

export type VerfuegbarkeitEvent = {
  id: string
  datum_von: string
  datum_bis: string
  zeitfenster_von: string | null
  zeitfenster_bis: string | null
  status: VerfuegbarkeitStatus
  grund: string | null
  notiz: string | null
}

// =============================================================================
// Person Resolution Helper
// =============================================================================

async function resolvePersonIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  personId?: string
): Promise<{ resolvedPersonId: string; profileId: string | null } | null> {
  if (personId) {
    // Management view: require permission and look up profile_id
    await requirePermission('mitglieder:read')

    const { data: person } = await supabase
      .from('personen')
      .select('id, profile_id')
      .eq('id', personId)
      .single()

    if (!person) return null
    return { resolvedPersonId: person.id, profileId: person.profile_id ?? null }
  }

  // Current user: resolve via email
  const profile = await getUserProfile()
  if (!profile) return null

  const { data: person } = await supabase
    .from('personen')
    .select('id, profile_id')
    .eq('email', profile.email)
    .single()

  if (!person) return null
  return { resolvedPersonId: person.id, profileId: person.profile_id ?? null }
}

// =============================================================================
// Get Personal Events
// =============================================================================

/**
 * Get all events where a person is a participant.
 * When personId is provided, requires mitglieder:read permission.
 * Otherwise resolves the current user.
 */
export async function getPersonalEvents(
  startDatum?: string,
  endDatum?: string,
  personId?: string
): Promise<PersonalEvent[]> {
  const supabase = await createClient()
  const resolved = await resolvePersonIds(supabase, personId)

  if (!resolved) return []

  const { resolvedPersonId, profileId } = resolved
  const events: PersonalEvent[] = []

  // 1. Get Veranstaltung Anmeldungen
  let anmeldungenQuery = supabase
    .from('anmeldungen')
    .select(`
      *,
      veranstaltung:veranstaltungen(
        id, titel, beschreibung, datum, startzeit, endzeit, ort, typ, status
      )
    `)
    .eq('person_id', resolvedPersonId)
    .neq('status', 'abgemeldet')

  if (startDatum) {
    anmeldungenQuery = anmeldungenQuery.gte('veranstaltung.datum', startDatum)
  }
  if (endDatum) {
    anmeldungenQuery = anmeldungenQuery.lte('veranstaltung.datum', endDatum)
  }

  const { data: anmeldungen } = await anmeldungenQuery

  type AnmeldungWithVeranstaltung = Anmeldung & {
    veranstaltung: Pick<
      Veranstaltung,
      'id' | 'titel' | 'beschreibung' | 'datum' | 'startzeit' | 'endzeit' | 'ort' | 'typ' | 'status'
    > | null
  }

  if (anmeldungen) {
    for (const a of anmeldungen as unknown as AnmeldungWithVeranstaltung[]) {
      if (!a.veranstaltung) continue

      events.push({
        id: `a-${a.id}`,
        titel: a.veranstaltung.titel,
        beschreibung: a.veranstaltung.beschreibung,
        datum: a.veranstaltung.datum,
        startzeit: a.veranstaltung.startzeit,
        endzeit: a.veranstaltung.endzeit,
        ort: a.veranstaltung.ort,
        typ: 'veranstaltung',
        status: a.status as PersonalEventStatus,
        veranstaltung_id: a.veranstaltung.id,
        anmeldung_id: a.id,
        kann_zusagen: a.status === 'warteliste',
        kann_absagen: a.status === 'angemeldet' || a.status === 'warteliste',
      })
    }
  }

  // 2. Get Proben Teilnahmen
  const probenQuery = supabase
    .from('proben_teilnehmer')
    .select(`
      *,
      probe:proben(
        id, titel, beschreibung, datum, startzeit, endzeit, ort, status,
        stueck:stuecke(id, titel)
      )
    `)
    .eq('person_id', resolvedPersonId)
    .not('status', 'in', '("abgesagt","nicht_erschienen")')

  const { data: probenTeilnahmen } = await probenQuery

  type TeilnehmerWithProbe = ProbeTeilnehmer & {
    probe: (Pick<
      Probe,
      'id' | 'titel' | 'beschreibung' | 'datum' | 'startzeit' | 'endzeit' | 'ort' | 'status'
    > & {
      stueck: { id: string; titel: string } | null
    }) | null
  }

  if (probenTeilnahmen) {
    for (const pt of probenTeilnahmen as unknown as TeilnehmerWithProbe[]) {
      if (!pt.probe) continue

      // Filter by date if specified
      if (startDatum && pt.probe.datum < startDatum) continue
      if (endDatum && pt.probe.datum > endDatum) continue

      events.push({
        id: `pt-${pt.id}`,
        titel: pt.probe.titel,
        beschreibung: pt.probe.beschreibung,
        datum: pt.probe.datum,
        startzeit: pt.probe.startzeit,
        endzeit: pt.probe.endzeit,
        ort: pt.probe.ort,
        typ: 'probe',
        status: pt.status as PersonalEventStatus,
        probe_id: pt.probe.id,
        teilnehmer_id: pt.id,
        stueck_titel: pt.probe.stueck?.titel || null,
        kann_zusagen: pt.status === 'eingeladen',
        kann_absagen: pt.status === 'zugesagt' || pt.status === 'eingeladen',
      })
    }
  }

  // 3. Get Schicht Zuweisungen (Helfer shifts for Aufführungen)
  const { data: zuweisungen } = await supabase
    .from('auffuehrung_zuweisungen')
    .select(`
      *,
      schicht:auffuehrung_schichten(
        id, rolle, veranstaltung_id,
        zeitblock:zeitbloecke(id, name, startzeit, endzeit),
        veranstaltung:veranstaltungen(id, titel, datum, ort)
      )
    `)
    .eq('person_id', resolvedPersonId)
    .neq('status', 'abgesagt')

  type ZuweisungWithDetails = AuffuehrungZuweisung & {
    schicht: {
      id: string
      rolle: string
      veranstaltung_id: string
      zeitblock: { id: string; name: string; startzeit: string; endzeit: string } | null
      veranstaltung: { id: string; titel: string; datum: string; ort: string | null } | null
    } | null
  }

  if (zuweisungen) {
    for (const z of zuweisungen as unknown as ZuweisungWithDetails[]) {
      if (!z.schicht?.veranstaltung) continue

      // Filter by date if specified
      const datum = z.schicht.veranstaltung.datum
      if (startDatum && datum < startDatum) continue
      if (endDatum && datum > endDatum) continue

      events.push({
        id: `z-${z.id}`,
        titel: `${z.schicht.veranstaltung.titel} - ${z.schicht.rolle}`,
        beschreibung: z.notizen,
        datum,
        startzeit: z.schicht.zeitblock?.startzeit || null,
        endzeit: z.schicht.zeitblock?.endzeit || null,
        ort: z.schicht.veranstaltung.ort,
        typ: 'schicht',
        status: z.status as PersonalEventStatus,
        veranstaltung_id: z.schicht.veranstaltung.id,
        schicht_id: z.schicht.id,
        zuweisung_id: z.id,
        rolle: z.schicht.rolle,
        zeitblock: z.schicht.zeitblock?.name || null,
        kann_zusagen: false,
        kann_absagen: z.status === 'zugesagt',
      })
    }
  }

  // 4. Get Helfer Anmeldungen (new Helferliste system)
  if (profileId) {
    const { data: helferAnmeldungen } = await supabase
      .from('helfer_anmeldungen')
      .select(`
        id,
        status,
        helfer_rollen_instanzen!inner (
          id,
          custom_name,
          zeitblock_start,
          zeitblock_end,
          helfer_rollen_templates ( name ),
          helfer_events!inner (
            id, name, beschreibung, datum_start, datum_end, ort
          )
        )
      `)
      .eq('profile_id', profileId)
      .neq('status', 'abgelehnt')

    type HelferAnmeldungWithDetails = {
      id: string
      status: string
      helfer_rollen_instanzen: {
        id: string
        custom_name: string | null
        zeitblock_start: string | null
        zeitblock_end: string | null
        helfer_rollen_templates: { name: string } | null
        helfer_events: {
          id: string
          name: string
          beschreibung: string | null
          datum_start: string
          datum_end: string
          ort: string | null
        }
      }
    }

    if (helferAnmeldungen) {
      for (const ha of helferAnmeldungen as unknown as HelferAnmeldungWithDetails[]) {
        const instanz = ha.helfer_rollen_instanzen
        const event = instanz.helfer_events
        const rolleName = instanz.helfer_rollen_templates?.name ?? instanz.custom_name ?? 'Helfer'

        // Use datum_start as the date (format: YYYY-MM-DD or datetime)
        const datum = event.datum_start.split('T')[0]

        if (startDatum && datum < startDatum) continue
        if (endDatum && datum > endDatum) continue

        events.push({
          id: `ha-${ha.id}`,
          titel: `${event.name} - ${rolleName}`,
          beschreibung: event.beschreibung,
          datum,
          startzeit: instanz.zeitblock_start,
          endzeit: instanz.zeitblock_end,
          ort: event.ort,
          typ: 'helfer',
          status: ha.status as PersonalEventStatus,
          helfer_anmeldung_id: ha.id,
          helfer_event_id: event.id,
          helfer_rolle: rolleName,
          kann_zusagen: false,
          kann_absagen: ha.status === 'angemeldet' || ha.status === 'bestaetigt',
        })
      }
    }
  }

  // 5. Get Helferschichten (legacy helper system)
  const { data: helferschichten } = await supabase
    .from('helferschichten')
    .select(`
      id,
      startzeit,
      endzeit,
      status,
      notizen,
      helferrolle:helferrollen ( id, rolle ),
      helfereinsatz:helfereinsaetze (
        id, titel, beschreibung, datum, startzeit, endzeit, ort
      )
    `)
    .eq('person_id', resolvedPersonId)
    .not('status', 'in', '("abgesagt","nicht_erschienen")')

  type HelferschichtWithDetails = {
    id: string
    startzeit: string | null
    endzeit: string | null
    status: string
    notizen: string | null
    helferrolle: { id: string; rolle: string } | null
    helfereinsatz: {
      id: string
      titel: string
      beschreibung: string | null
      datum: string
      startzeit: string | null
      endzeit: string | null
      ort: string | null
    } | null
  }

  if (helferschichten) {
    for (const hs of helferschichten as unknown as HelferschichtWithDetails[]) {
      if (!hs.helfereinsatz) continue

      const datum = hs.helfereinsatz.datum
      if (startDatum && datum < startDatum) continue
      if (endDatum && datum > endDatum) continue

      const rolleName = hs.helferrolle?.rolle ?? null

      events.push({
        id: `hs-${hs.id}`,
        titel: rolleName
          ? `${hs.helfereinsatz.titel} - ${rolleName}`
          : hs.helfereinsatz.titel,
        beschreibung: hs.helfereinsatz.beschreibung,
        datum,
        startzeit: hs.startzeit ?? hs.helfereinsatz.startzeit,
        endzeit: hs.endzeit ?? hs.helfereinsatz.endzeit,
        ort: hs.helfereinsatz.ort,
        typ: 'helfereinsatz_legacy',
        status: hs.status as PersonalEventStatus,
        helferschicht_id: hs.id,
        helfereinsatz_id: hs.helfereinsatz.id,
        helfer_rolle: rolleName,
        kann_zusagen: false,
        kann_absagen: hs.status === 'zugesagt',
      })
    }
  }

  // Sort by date and time
  events.sort((a, b) => {
    const dateCompare = a.datum.localeCompare(b.datum)
    if (dateCompare !== 0) return dateCompare
    const aTime = a.startzeit || '00:00'
    const bTime = b.startzeit || '00:00'
    return aTime.localeCompare(bTime)
  })

  return events
}

// =============================================================================
// Get Person Verfuegbarkeiten
// =============================================================================

/**
 * Get availability entries for a person.
 * When personId is provided, requires mitglieder:read permission.
 * Otherwise resolves the current user.
 */
export async function getPersonVerfuegbarkeiten(
  personId?: string,
  startDatum?: string,
  endDatum?: string
): Promise<VerfuegbarkeitEvent[]> {
  const supabase = await createClient()
  const resolved = await resolvePersonIds(supabase, personId)

  if (!resolved) return []

  let query = supabase
    .from('verfuegbarkeiten')
    .select('id, datum_von, datum_bis, zeitfenster_von, zeitfenster_bis, status, grund, notiz')
    .eq('mitglied_id', resolved.resolvedPersonId)

  if (startDatum) {
    query = query.gte('datum_bis', startDatum)
  }
  if (endDatum) {
    query = query.lte('datum_von', endDatum)
  }

  const { data } = await query

  if (!data) return []

  return data as VerfuegbarkeitEvent[]
}

// =============================================================================
// Accept/Decline Actions
// =============================================================================

/**
 * Accept an invitation (Probe or Veranstaltung)
 */
export async function acceptPersonalEvent(
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const resolved = await resolvePersonIds(supabase)

  if (!resolved) {
    return { success: false, error: 'Nicht angemeldet' }
  }

  const { resolvedPersonId } = resolved
  const [type, id] = eventId.split('-')

  if (type === 'pt') {
    // Update Probe Teilnehmer status — with ownership filter
    const { error } = await supabase
      .from('proben_teilnehmer')
      .update({ status: 'zugesagt' as TeilnehmerStatus } as never)
      .eq('id', id)
      .eq('person_id', resolvedPersonId)

    if (error) {
      console.error('Error accepting probe:', error)
      return { success: false, error: 'Fehler beim Akzeptieren' }
    }

    return { success: true }
  }

  return { success: false, error: 'Aktion nicht unterstützt' }
}

/**
 * Decline/Cancel participation
 */
export async function declinePersonalEvent(
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const resolved = await resolvePersonIds(supabase)

  if (!resolved) {
    return { success: false, error: 'Nicht angemeldet' }
  }

  const { resolvedPersonId } = resolved
  const [type, id] = eventId.split('-')

  if (type === 'a') {
    // Update Anmeldung status — with ownership filter
    const { error } = await supabase
      .from('anmeldungen')
      .update({ status: 'abgemeldet' } as never)
      .eq('id', id)
      .eq('person_id', resolvedPersonId)

    if (error) {
      console.error('Error declining anmeldung:', error)
      return { success: false, error: 'Fehler beim Absagen' }
    }

    return { success: true }
  }

  if (type === 'pt') {
    // Update Probe Teilnehmer status — with ownership filter
    const { error } = await supabase
      .from('proben_teilnehmer')
      .update({ status: 'abgesagt' as TeilnehmerStatus } as never)
      .eq('id', id)
      .eq('person_id', resolvedPersonId)

    if (error) {
      console.error('Error declining probe:', error)
      return { success: false, error: 'Fehler beim Absagen' }
    }

    return { success: true }
  }

  if (type === 'z') {
    // Update Zuweisung status — with ownership filter
    const { error } = await supabase
      .from('auffuehrung_zuweisungen')
      .update({ status: 'abgesagt' } as never)
      .eq('id', id)
      .eq('person_id', resolvedPersonId)

    if (error) {
      console.error('Error declining zuweisung:', error)
      return { success: false, error: 'Fehler beim Absagen' }
    }

    return { success: true }
  }

  if (type === 'ha') {
    // Update Helfer Anmeldung status (new system) — with ownership filter
    const { error } = await supabase
      .from('helfer_anmeldungen')
      .update({ status: 'abgelehnt' } as never)
      .eq('id', id)
      .eq('person_id', resolvedPersonId)

    if (error) {
      console.error('Error declining helfer anmeldung:', error)
      return { success: false, error: 'Fehler beim Absagen' }
    }

    return { success: true }
  }

  if (type === 'hs') {
    // Update Helferschicht status (legacy system) — with ownership filter
    const { error } = await supabase
      .from('helferschichten')
      .update({ status: 'abgesagt' } as never)
      .eq('id', id)
      .eq('person_id', resolvedPersonId)

    if (error) {
      console.error('Error declining helferschicht:', error)
      return { success: false, error: 'Fehler beim Absagen' }
    }

    return { success: true }
  }

  return { success: false, error: 'Aktion nicht unterstützt' }
}

// =============================================================================
// iCal Feed Generation
// =============================================================================

/**
 * Generate iCal content for personal events
 */
export async function generatePersonalICalFeed(): Promise<string> {
  const events = await getPersonalEvents()

  let ical =
    'BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//BackstagePass//Meine Termine//DE\r\nCALSCALE:GREGORIAN\r\nMETHOD:PUBLISH\r\nX-WR-CALNAME:Meine TGW Termine\r\n'

  for (const event of events) {
    if (event.status === 'abgesagt' || event.status === 'abgemeldet' || event.status === 'abgelehnt') continue

    const startDate = event.datum.replace(/-/g, '')
    const startTime = event.startzeit
      ? event.startzeit.replace(/:/g, '').substring(0, 4) + '00'
      : '000000'
    const endTime = event.endzeit
      ? event.endzeit.replace(/:/g, '').substring(0, 4) + '00'
      : '235959'
    const uid = `personal-${event.id}@backstagepass.tgw`

    ical += 'BEGIN:VEVENT\r\n'
    ical += `UID:${uid}\r\n`
    ical += `DTSTART:${startDate}T${startTime}\r\n`
    ical += `DTEND:${startDate}T${endTime}\r\n`
    ical += `SUMMARY:${escapeICalText(event.titel)}\r\n`

    if (event.beschreibung) {
      ical += `DESCRIPTION:${escapeICalText(event.beschreibung)}\r\n`
    }
    if (event.ort) {
      ical += `LOCATION:${escapeICalText(event.ort)}\r\n`
    }
    if (event.rolle || event.helfer_rolle) {
      ical += `X-TGW-ROLLE:${escapeICalText(event.rolle || event.helfer_rolle || '')}\r\n`
    }

    const categoryMap: Record<PersonalEventTyp, string> = {
      veranstaltung: 'VERANSTALTUNG',
      probe: 'PROBE',
      schicht: 'SCHICHT',
      helfer: 'HELFER',
      helfereinsatz_legacy: 'HELFEREINSATZ',
    }
    ical += `CATEGORIES:${categoryMap[event.typ]}\r\n`

    ical += 'END:VEVENT\r\n'
  }

  ical += 'END:VCALENDAR\r\n'
  return ical
}

function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '')
}
