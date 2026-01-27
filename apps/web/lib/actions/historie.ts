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
