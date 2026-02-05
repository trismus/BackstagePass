'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../supabase/server'
import { requirePermission } from '../supabase/auth-helpers'
import type {
  Zeitblock,
  AuffuehrungSchicht,
  AuffuehrungZuweisung,
  Person,
  ExterneHelferProfil,
  HelferWarteliste,
  Profile,
} from '../supabase/types'

// =============================================================================
// Types
// =============================================================================

export type HelferDetails = {
  id: string
  name: string
  email: string | null
  telefon: string | null
  isExtern: boolean
  zuweisungId: string
  status: string
  notizen: string | null
}

export type SchichtMitHelfer = AuffuehrungSchicht & {
  zeitblock: Pick<Zeitblock, 'id' | 'name' | 'startzeit' | 'endzeit' | 'typ'> | null
  sichtbarkeit?: 'intern' | 'public'
  helfer: HelferDetails[]
  anzahlBesetzt: number
  warteliste: WartelisteEintrag[]
}

export type ZeitblockMitSchichten = Zeitblock & {
  schichten: SchichtMitHelfer[]
  gesamtSlots: number
  besetztSlots: number
}

export type WartelisteEintrag = {
  id: string
  position: number
  status: string
  name: string
  email: string | null
  isExtern: boolean
  erstelltAm: string
}

export type KoordinationMetrics = {
  gesamtSlots: number
  besetztSlots: number
  offeneSlots: number
  warteliste: number
  auslastungProzent: number
}

export type KoordinationData = {
  veranstaltung: {
    id: string
    titel: string
    datum: string
    startzeit: string | null
    endzeit: string | null
    ort: string | null
    helfer_status: string | null
  }
  metrics: KoordinationMetrics
  zeitbloecke: ZeitblockMitSchichten[]
  alleWarteliste: WartelisteEintrag[]
}

// =============================================================================
// Main Data Fetching
// =============================================================================

/**
 * Get all coordination data for a performance
 */
export async function getKoordinationData(
  veranstaltungId: string
): Promise<KoordinationData | null> {
  await requirePermission('veranstaltungen:write')

  const supabase = await createClient()

  // Get veranstaltung
  const { data: veranstaltung, error: veranstaltungError } = await supabase
    .from('veranstaltungen')
    .select('id, titel, datum, startzeit, endzeit, ort, helfer_status')
    .eq('id', veranstaltungId)
    .single()

  if (veranstaltungError || !veranstaltung) {
    console.error('Error fetching veranstaltung:', veranstaltungError)
    return null
  }

  // Get zeitbloecke with schichten
  const { data: zeitbloecke, error: zeitblockError } = await supabase
    .from('zeitbloecke')
    .select(`
      *,
      schichten:auffuehrung_schichten(
        *,
        zuweisungen:auffuehrung_zuweisungen(
          *,
          person:personen(id, vorname, nachname, email, telefon)
        )
      )
    `)
    .eq('veranstaltung_id', veranstaltungId)
    .order('sortierung', { ascending: true })

  if (zeitblockError) {
    console.error('Error fetching zeitbloecke:', zeitblockError)
    return null
  }

  // Get orphan schichten (without zeitblock)
  const { data: orphanSchichten } = await supabase
    .from('auffuehrung_schichten')
    .select(`
      *,
      zuweisungen:auffuehrung_zuweisungen(
        *,
        person:personen(id, vorname, nachname, email, telefon)
      )
    `)
    .eq('veranstaltung_id', veranstaltungId)
    .is('zeitblock_id', null)

  // Get all schicht IDs for waitlist query
  const allSchichtIds = [
    ...(zeitbloecke?.flatMap((zb) =>
      (zb.schichten || []).map((s: AuffuehrungSchicht) => s.id)
    ) || []),
    ...(orphanSchichten?.map((s) => s.id) || []),
  ]

  // Get waitlist entries
  let wartelisteData: (HelferWarteliste & {
    profile: Pick<Profile, 'id' | 'display_name' | 'email'> | null
    external_helper: Pick<ExterneHelferProfil, 'id' | 'vorname' | 'nachname' | 'email'> | null
  })[] = []

  if (allSchichtIds.length > 0) {
    const { data: wl } = await supabase
      .from('helfer_warteliste')
      .select(`
        *,
        profile:profiles(id, display_name, email),
        external_helper:externe_helfer_profile(id, vorname, nachname, email)
      `)
      .in('schicht_id', allSchichtIds)
      .order('position', { ascending: true })

    if (wl) {
      wartelisteData = wl as typeof wartelisteData
    }
  }

  // Group waitlist by schicht_id
  const wartelisteBySchicht = new Map<string, WartelisteEintrag[]>()
  wartelisteData.forEach((entry) => {
    const schichtId = entry.schicht_id
    if (!wartelisteBySchicht.has(schichtId)) {
      wartelisteBySchicht.set(schichtId, [])
    }
    const profileData = entry.profile as { id: string; display_name: string | null; email: string } | null
    const externalData = entry.external_helper as { id: string; vorname: string; nachname: string; email: string } | null

    wartelisteBySchicht.get(schichtId)!.push({
      id: entry.id,
      position: entry.position,
      status: entry.status,
      name: externalData
        ? `${externalData.vorname} ${externalData.nachname}`
        : profileData?.display_name || profileData?.email || 'Unbekannt',
      email: externalData?.email || profileData?.email || null,
      isExtern: !!externalData,
      erstelltAm: entry.erstellt_am,
    })
  })

  // Transform data
  const transformSchicht = (
    schicht: AuffuehrungSchicht & {
      zuweisungen: (AuffuehrungZuweisung & { person: Pick<Person, 'id' | 'vorname' | 'nachname' | 'email' | 'telefon'> | null })[]
    },
    zeitblock: Pick<Zeitblock, 'id' | 'name' | 'startzeit' | 'endzeit' | 'typ'> | null
  ): SchichtMitHelfer => {
    const activeZuweisungen = (schicht.zuweisungen || []).filter(
      (z) => z.status !== 'abgesagt'
    )

    return {
      ...schicht,
      zeitblock,
      helfer: activeZuweisungen.map((z) => ({
        id: z.person?.id || '',
        name: z.person ? `${z.person.vorname} ${z.person.nachname}` : 'Unbekannt',
        email: z.person?.email || null,
        telefon: z.person?.telefon || null,
        isExtern: false, // Internal zuweisungen are always from personen
        zuweisungId: z.id,
        status: z.status,
        notizen: z.notizen,
      })),
      anzahlBesetzt: activeZuweisungen.length,
      warteliste: wartelisteBySchicht.get(schicht.id) || [],
    }
  }

  // Build transformed zeitbloecke
  const transformedZeitbloecke: ZeitblockMitSchichten[] = (zeitbloecke || []).map((zb) => {
    const schichten = (zb.schichten || []).map((s: AuffuehrungSchicht & { zuweisungen: (AuffuehrungZuweisung & { person: Pick<Person, 'id' | 'vorname' | 'nachname' | 'email' | 'telefon'> | null })[] }) =>
      transformSchicht(s, {
        id: zb.id,
        name: zb.name,
        startzeit: zb.startzeit,
        endzeit: zb.endzeit,
        typ: zb.typ,
      })
    )

    const gesamtSlots = schichten.reduce((sum: number, s: SchichtMitHelfer) => sum + s.anzahl_benoetigt, 0)
    const besetztSlots = schichten.reduce((sum: number, s: SchichtMitHelfer) => sum + s.anzahlBesetzt, 0)

    return {
      ...zb,
      schichten,
      gesamtSlots,
      besetztSlots,
    }
  })

  // Add orphan schichten as virtual zeitblock
  if (orphanSchichten && orphanSchichten.length > 0) {
    const orphanTransformed = orphanSchichten.map((s: AuffuehrungSchicht & { zuweisungen: (AuffuehrungZuweisung & { person: Pick<Person, 'id' | 'vorname' | 'nachname' | 'email' | 'telefon'> | null })[] }) =>
      transformSchicht(s, null)
    )

    const gesamtSlots = orphanTransformed.reduce((sum, s) => sum + s.anzahl_benoetigt, 0)
    const besetztSlots = orphanTransformed.reduce((sum, s) => sum + s.anzahlBesetzt, 0)

    transformedZeitbloecke.push({
      id: 'no-zeitblock',
      veranstaltung_id: veranstaltungId,
      name: 'Ohne Zeitblock',
      startzeit: veranstaltung.startzeit || '00:00',
      endzeit: veranstaltung.endzeit || '23:59',
      typ: 'standard',
      sortierung: 9999,
      created_at: new Date().toISOString(),
      schichten: orphanTransformed,
      gesamtSlots,
      besetztSlots,
    })
  }

  // Calculate metrics
  const gesamtSlots = transformedZeitbloecke.reduce((sum, zb) => sum + zb.gesamtSlots, 0)
  const besetztSlots = transformedZeitbloecke.reduce((sum, zb) => sum + zb.besetztSlots, 0)
  const totalWarteliste = wartelisteData.filter((w) => w.status === 'wartend').length

  const metrics: KoordinationMetrics = {
    gesamtSlots,
    besetztSlots,
    offeneSlots: gesamtSlots - besetztSlots,
    warteliste: totalWarteliste,
    auslastungProzent: gesamtSlots > 0 ? Math.round((besetztSlots / gesamtSlots) * 100) : 0,
  }

  // Flatten all warteliste entries
  const alleWarteliste: WartelisteEintrag[] = wartelisteData
    .filter((w) => w.status === 'wartend')
    .map((entry) => {
      const profileData = entry.profile as { id: string; display_name: string | null; email: string } | null
      const externalData = entry.external_helper as { id: string; vorname: string; nachname: string; email: string } | null
      return {
        id: entry.id,
        position: entry.position,
        status: entry.status,
        name: externalData
          ? `${externalData.vorname} ${externalData.nachname}`
          : profileData?.display_name || profileData?.email || 'Unbekannt',
        email: externalData?.email || profileData?.email || null,
        isExtern: !!externalData,
        erstelltAm: entry.erstellt_am,
      }
    })

  return {
    veranstaltung,
    metrics,
    zeitbloecke: transformedZeitbloecke,
    alleWarteliste,
  }
}

// =============================================================================
// Actions
// =============================================================================

/**
 * Remove a helper from a shift (admin action)
 */
export async function removeHelferFromSchicht(
  zuweisungId: string
): Promise<{ success: boolean; error?: string }> {
  await requirePermission('veranstaltungen:write')

  const supabase = await createClient()

  // Get zuweisung for revalidation path
  const { data: zuweisung } = await supabase
    .from('auffuehrung_zuweisungen')
    .select('schicht_id, schicht:auffuehrung_schichten(veranstaltung_id)')
    .eq('id', zuweisungId)
    .single()

  const { error } = await supabase
    .from('auffuehrung_zuweisungen')
    .delete()
    .eq('id', zuweisungId)

  if (error) {
    console.error('Error removing helfer:', error)
    return { success: false, error: 'Fehler beim Entfernen des Helfers' }
  }

  if (zuweisung?.schicht) {
    const schichtData = zuweisung.schicht as unknown as { veranstaltung_id: string }
    revalidatePath(`/auffuehrungen/${schichtData.veranstaltung_id}/helfer-koordination`)
    revalidatePath(`/auffuehrungen/${schichtData.veranstaltung_id}/helferliste`)
  }

  return { success: true }
}

/**
 * Copy all helper emails to clipboard (returns comma-separated list)
 */
export async function getAllHelferEmails(
  veranstaltungId: string
): Promise<{ success: boolean; emails?: string; count?: number; error?: string }> {
  await requirePermission('veranstaltungen:write')

  const supabase = await createClient()

  // Get all schicht IDs for this veranstaltung
  const { data: schichten } = await supabase
    .from('auffuehrung_schichten')
    .select('id')
    .eq('veranstaltung_id', veranstaltungId)

  if (!schichten || schichten.length === 0) {
    return { success: true, emails: '', count: 0 }
  }

  const schichtIds = schichten.map((s) => s.id)

  // Get all zuweisungen with person emails
  const { data: zuweisungen } = await supabase
    .from('auffuehrung_zuweisungen')
    .select('person:personen(email)')
    .in('schicht_id', schichtIds)
    .neq('status', 'abgesagt')

  const emails = new Set<string>()

  zuweisungen?.forEach((z) => {
    const person = z.person as unknown as { email: string | null }
    if (person?.email) {
      emails.add(person.email)
    }
  })

  const emailList = Array.from(emails).sort().join(', ')

  return { success: true, emails: emailList, count: emails.size }
}

/**
 * Update helper status (publish, close, etc.)
 */
export async function updateHelferStatus(
  veranstaltungId: string,
  status: 'entwurf' | 'veroeffentlicht' | 'abgeschlossen'
): Promise<{ success: boolean; error?: string }> {
  await requirePermission('veranstaltungen:write')

  const supabase = await createClient()

  const { error } = await supabase
    .from('veranstaltungen')
    .update({ helfer_status: status } as never)
    .eq('id', veranstaltungId)

  if (error) {
    console.error('Error updating helfer status:', error)
    return { success: false, error: 'Fehler beim Aktualisieren des Status' }
  }

  revalidatePath(`/auffuehrungen/${veranstaltungId}/helfer-koordination`)
  revalidatePath(`/auffuehrungen/${veranstaltungId}`)

  return { success: true }
}
