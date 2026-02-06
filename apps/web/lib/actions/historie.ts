'use server'

import { createClient } from '../supabase/server'

export interface RollenHistorieEintrag {
  id: string
  oldRole: string | null
  newRole: string | null
  changedAt: string
  changedBy?: string
}

export interface HelfereinsatzHistorieEintrag {
  id: string
  helfereinsatzId: string
  titel: string
  datum: string
  ort: string | null
  partnerName: string | null
  status: string
  stundenGearbeitet: number | null
}

export interface AuffuehrungHelferHistorieEintrag {
  id: string
  veranstaltungId: string
  veranstaltungTitel: string
  datum: string
  rolle: string
  zeitblock: string | null
  checkedIn: boolean
  noShow: boolean
  stundenGearbeitet: number
}

/**
 * Get role change history for the current user
 */
export async function getRollenHistorie(): Promise<RollenHistorieEintrag[]> {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  // Query audit logs for role changes
  const { data, error } = await supabase
    .from('audit_logs')
    .select('id, details, created_at, user_email')
    .eq('entity_type', 'profile')
    .eq('entity_id', user.id)
    .eq('action', 'profile.updated')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    console.error('Error fetching role history:', error)
    return []
  }

  // Filter and transform to role changes only
  const roleChanges: RollenHistorieEintrag[] = []

  for (const log of data || []) {
    const details = log.details as { changes?: { role?: { old: string; new: string } } }
    if (details?.changes?.role) {
      roleChanges.push({
        id: log.id,
        oldRole: details.changes.role.old,
        newRole: details.changes.role.new,
        changedAt: log.created_at,
        changedBy: log.user_email,
      })
    }
  }

  return roleChanges
}

/**
 * Get helper event history for a person
 */
export async function getHelfereinsatzHistorie(
  personId: string
): Promise<HelfereinsatzHistorieEintrag[]> {
  const supabase = await createClient()

  const today = new Date().toISOString().split('T')[0]

  // Get past helper events where the person participated
  const { data, error } = await supabase
    .from('helferschichten')
    .select(`
      id,
      status,
      stunden_gearbeitet,
      helfereinsatz:helfereinsaetze(
        id,
        titel,
        datum,
        ort,
        partner:partner(name)
      )
    `)
    .eq('person_id', personId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching helper event history:', error)
    return []
  }

  // Transform and filter to past events
  const historie: HelfereinsatzHistorieEintrag[] = []

  for (const schicht of data || []) {
    // helfereinsatz is a single object (not array) due to foreign key relationship
    const einsatz = schicht.helfereinsatz as unknown as {
      id: string
      titel: string
      datum: string
      ort: string | null
      partner: { name: string } | null
    } | null

    if (einsatz && einsatz.datum < today) {
      historie.push({
        id: schicht.id,
        helfereinsatzId: einsatz.id,
        titel: einsatz.titel,
        datum: einsatz.datum,
        ort: einsatz.ort,
        partnerName: einsatz.partner?.name || null,
        status: schicht.status,
        stundenGearbeitet: schicht.stunden_gearbeitet,
      })
    }
  }

  // Sort by date descending
  historie.sort((a, b) => b.datum.localeCompare(a.datum))

  return historie
}

/**
 * Get helper event history for the current user (via their person record)
 */
export async function getOwnHelfereinsatzHistorie(): Promise<HelfereinsatzHistorieEintrag[]> {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  // Get the user's profile to find their email
  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', user.id)
    .single()

  if (!profile?.email) {
    return []
  }

  // Find the person linked to this email
  const { data: person } = await supabase
    .from('personen')
    .select('id')
    .eq('email', profile.email)
    .single()

  if (!person) {
    return []
  }

  return getHelfereinsatzHistorie(person.id)
}

/**
 * Calculate hours from start and end time
 */
function calculateHours(startzeit: string, endzeit: string): number {
  const start = new Date(`2000-01-01T${startzeit}`)
  const end = new Date(`2000-01-01T${endzeit}`)
  let hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
  if (hours < 0) hours += 24
  return Math.round(hours * 4) / 4
}

/**
 * Get auffuehrung helper history for a person
 */
export async function getAuffuehrungHelferHistorie(
  personId: string
): Promise<AuffuehrungHelferHistorieEintrag[]> {
  const supabase = await createClient()

  const today = new Date().toISOString().split('T')[0]

  // Get all zuweisungen for this person
  const { data, error } = await supabase
    .from('auffuehrung_zuweisungen')
    .select(`
      id,
      checked_in_at,
      no_show,
      status,
      schicht:auffuehrung_schichten(
        id,
        rolle,
        veranstaltung_id,
        zeitblock:zeitbloecke(name, startzeit, endzeit),
        veranstaltung:veranstaltungen(id, titel, datum)
      )
    `)
    .eq('person_id', personId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching auffuehrung helper history:', error)
    return []
  }

  // Transform and filter to past events
  const historie: AuffuehrungHelferHistorieEintrag[] = []

  for (const zuweisung of data || []) {
    const schicht = zuweisung.schicht as unknown as {
      id: string
      rolle: string
      veranstaltung_id: string
      zeitblock: { name: string; startzeit: string; endzeit: string } | null
      veranstaltung: { id: string; titel: string; datum: string } | null
    } | null

    if (!schicht?.veranstaltung) continue
    if (schicht.veranstaltung.datum >= today) continue
    if (zuweisung.status === 'abgesagt') continue

    const stunden = schicht.zeitblock
      ? calculateHours(schicht.zeitblock.startzeit, schicht.zeitblock.endzeit)
      : 0

    historie.push({
      id: zuweisung.id,
      veranstaltungId: schicht.veranstaltung.id,
      veranstaltungTitel: schicht.veranstaltung.titel,
      datum: schicht.veranstaltung.datum,
      rolle: schicht.rolle,
      zeitblock: schicht.zeitblock?.name || null,
      checkedIn: !!zuweisung.checked_in_at,
      noShow: zuweisung.no_show || false,
      stundenGearbeitet: stunden,
    })
  }

  // Sort by date descending
  historie.sort((a, b) => b.datum.localeCompare(a.datum))

  return historie
}

/**
 * Get auffuehrung helper history for the current user
 */
export async function getOwnAuffuehrungHelferHistorie(): Promise<AuffuehrungHelferHistorieEintrag[]> {
  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  // Get the user's profile to find their email
  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', user.id)
    .single()

  if (!profile?.email) {
    return []
  }

  // Find the person linked to this email
  const { data: person } = await supabase
    .from('personen')
    .select('id')
    .eq('email', profile.email)
    .single()

  if (!person) {
    return []
  }

  return getAuffuehrungHelferHistorie(person.id)
}

/**
 * Get combined helper statistics for a person
 */
export async function getHelferStatistik(
  personId: string
): Promise<{
  auffuehrungen: { total: number; erschienen: number; noShows: number; stunden: number }
  helfereinsaetze: { total: number; stunden: number }
}> {
  const [auffHistorie, einsatzHistorie] = await Promise.all([
    getAuffuehrungHelferHistorie(personId),
    getHelfereinsatzHistorie(personId),
  ])

  return {
    auffuehrungen: {
      total: auffHistorie.length,
      erschienen: auffHistorie.filter((h) => h.checkedIn).length,
      noShows: auffHistorie.filter((h) => h.noShow).length,
      stunden: auffHistorie
        .filter((h) => h.checkedIn)
        .reduce((sum, h) => sum + h.stundenGearbeitet, 0),
    },
    helfereinsaetze: {
      total: einsatzHistorie.length,
      stunden: einsatzHistorie.reduce((sum, h) => sum + (h.stundenGearbeitet || 0), 0),
    },
  }
}
