'use server'

import { createClient, getUserProfile } from '../supabase/server'
import type {
  Veranstaltung,
  Probe,
  Anmeldung,
  ProbeTeilnehmer,
  AuffuehrungZuweisung,
  TeilnehmerStatus,
} from '../supabase/types'

// =============================================================================
// Types
// =============================================================================

export type PersonalEventTyp = 'veranstaltung' | 'probe' | 'schicht'

export type PersonalEventStatus =
  | 'angemeldet'
  | 'warteliste'
  | 'eingeladen'
  | 'zugesagt'
  | 'abgesagt'
  | 'abgemeldet'
  | 'erschienen'

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
  // Extra info
  stueck_titel?: string | null
  rolle?: string | null
  zeitblock?: string | null
  // Actions
  kann_zusagen: boolean
  kann_absagen: boolean
}

// =============================================================================
// Get Personal Events
// =============================================================================

/**
 * Get all events where the current user is a participant
 */
export async function getPersonalEvents(
  startDatum?: string,
  endDatum?: string
): Promise<PersonalEvent[]> {
  const supabase = await createClient()
  const profile = await getUserProfile()

  if (!profile) {
    return []
  }

  const events: PersonalEvent[] = []

  // Find the person linked to this user
  const { data: person } = await supabase
    .from('personen')
    .select('id')
    .eq('email', profile.email)
    .single()

  if (!person) {
    return []
  }

  // 1. Get Veranstaltung Anmeldungen
  let anmeldungenQuery = supabase
    .from('anmeldungen')
    .select(`
      *,
      veranstaltung:veranstaltungen(
        id, titel, beschreibung, datum, startzeit, endzeit, ort, typ, status
      )
    `)
    .eq('person_id', person.id)
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
    .eq('person_id', person.id)
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
    .eq('person_id', person.id)
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
// Accept/Decline Actions
// =============================================================================

/**
 * Accept an invitation (Probe or Veranstaltung)
 */
export async function acceptPersonalEvent(
  eventId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const profile = await getUserProfile()

  if (!profile) {
    return { success: false, error: 'Nicht angemeldet' }
  }

  const [type, id] = eventId.split('-')

  if (type === 'pt') {
    // Update Probe Teilnehmer status
    const { error } = await supabase
      .from('proben_teilnehmer')
      .update({ status: 'zugesagt' as TeilnehmerStatus } as never)
      .eq('id', id)

    if (error) {
      console.error('Error accepting probe:', error)
      return { success: false, error: error.message }
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
  const profile = await getUserProfile()

  if (!profile) {
    return { success: false, error: 'Nicht angemeldet' }
  }

  const [type, id] = eventId.split('-')

  if (type === 'a') {
    // Update Anmeldung status
    const { error } = await supabase
      .from('anmeldungen')
      .update({ status: 'abgemeldet' } as never)
      .eq('id', id)

    if (error) {
      console.error('Error declining anmeldung:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  }

  if (type === 'pt') {
    // Update Probe Teilnehmer status
    const { error } = await supabase
      .from('proben_teilnehmer')
      .update({ status: 'abgesagt' as TeilnehmerStatus } as never)
      .eq('id', id)

    if (error) {
      console.error('Error declining probe:', error)
      return { success: false, error: error.message }
    }

    return { success: true }
  }

  if (type === 'z') {
    // Update Zuweisung status
    const { error } = await supabase
      .from('auffuehrung_zuweisungen')
      .update({ status: 'abgesagt' } as never)
      .eq('id', id)

    if (error) {
      console.error('Error declining zuweisung:', error)
      return { success: false, error: error.message }
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
    if (event.status === 'abgesagt' || event.status === 'abgemeldet') continue

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
    if (event.rolle) {
      ical += `X-TGW-ROLLE:${escapeICalText(event.rolle)}\r\n`
    }

    const categoryMap: Record<PersonalEventTyp, string> = {
      veranstaltung: 'VERANSTALTUNG',
      probe: 'PROBE',
      schicht: 'SCHICHT',
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
