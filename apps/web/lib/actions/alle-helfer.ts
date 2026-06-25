'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../supabase/server'
import { requirePermission } from '../supabase/auth-helpers'
import { sanitizeSearchQuery } from '../utils/search'
import { helferErfassenSchema, helferUpdateSchema } from '../validations/alle-helfer'

export type HelferTyp = 'intern' | 'extern'
export type AlleHelferSortField = 'name' | 'einsaetze' | 'letzter_einsatz'
export type SortOrder = 'asc' | 'desc'

export interface HelferUebersicht {
  id: string
  typ: HelferTyp
  vorname: string
  nachname: string
  email: string | null
  telefon: string | null
  einsaetze_count: number
  letzter_einsatz: string | null
}

export interface AlleHelferFilterParams {
  search?: string
  typ?: HelferTyp | 'alle'
  sortBy?: AlleHelferSortField
  sortOrder?: SortOrder
}

export interface HelferEinsatzDetail {
  id: string
  veranstaltung: string
  datum: string
  rolle: string
  zeitblock_start: string | null
  zeitblock_end: string | null
  status: string
}

/**
 * Get consolidated list of all helpers (internal + external)
 */
export async function getAlleHelfer(
  params: AlleHelferFilterParams = {}
): Promise<HelferUebersicht[]> {
  await requirePermission('mitglieder:read')

  const {
    search = '',
    typ = 'alle',
    sortBy = 'name',
    sortOrder = 'asc',
  } = params

  const supabase = await createClient()
  const results: HelferUebersicht[] = []

  // Fetch internal helpers (personen with auffuehrung_zuweisungen)
  if (typ === 'alle' || typ === 'intern') {
    const { data: interne, error: interneError } = await supabase
      .from('auffuehrung_zuweisungen')
      .select(`
        person_id,
        created_at,
        person:personen!auffuehrung_zuweisungen_person_id_fkey(
          id, vorname, nachname, email, telefon
        )
      `)
      .not('person_id', 'is', null)

    if (interneError) {
      console.error('Error fetching internal helpers:', interneError)
    } else if (interne) {
      // Group by person_id to get counts and latest assignment
      const personMap = new Map<
        string,
        {
          person: { id: string; vorname: string; nachname: string; email: string | null; telefon: string | null }
          count: number
          letzter_einsatz: string | null
        }
      >()

      for (const z of interne) {
        if (!z.person_id || !z.person) continue
        const person = z.person as unknown as {
          id: string; vorname: string; nachname: string; email: string | null; telefon: string | null
        }

        const existing = personMap.get(z.person_id)
        if (existing) {
          existing.count++
          if (z.created_at > (existing.letzter_einsatz || '')) {
            existing.letzter_einsatz = z.created_at
          }
        } else {
          personMap.set(z.person_id, {
            person,
            count: 1,
            letzter_einsatz: z.created_at,
          })
        }
      }

      for (const [, entry] of personMap) {
        results.push({
          id: entry.person.id,
          typ: 'intern',
          vorname: entry.person.vorname,
          nachname: entry.person.nachname,
          email: entry.person.email,
          telefon: entry.person.telefon,
          einsaetze_count: entry.count,
          letzter_einsatz: entry.letzter_einsatz,
        })
      }
    }
  }

  // Fetch external helpers
  if (typ === 'alle' || typ === 'extern') {
    const { data: externe, error: externeError } = await supabase
      .from('externe_helfer_profile')
      .select(`
        id, vorname, nachname, email, telefon, letzter_einsatz
      `)

    if (externeError) {
      console.error('Error fetching external helpers:', externeError)
    } else if (externe) {
      // Collect emails to find matching personen with auffuehrung_zuweisungen
      const externeEmails = externe
        .map((e) => e.email)
        .filter((e): e is string => !!e)

      // Build a map of email -> auffuehrung_zuweisungen count
      const emailZuweisungCounts = new Map<string, { count: number; letzter: string | null }>()

      if (externeEmails.length > 0) {
        const { data: personenMatches } = await supabase
          .from('personen')
          .select('id, email')
          .in('email', externeEmails)

        if (personenMatches && personenMatches.length > 0) {
          const personIds = personenMatches.map((p) => p.id)
          const { data: zuweisungen } = await supabase
            .from('auffuehrung_zuweisungen')
            .select('person_id, created_at')
            .in('person_id', personIds)

          if (zuweisungen) {
            // Group by person_id
            const personCounts = new Map<string, { count: number; letzter: string | null }>()
            for (const z of zuweisungen) {
              const existing = personCounts.get(z.person_id)
              if (existing) {
                existing.count++
                if (z.created_at > (existing.letzter || '')) {
                  existing.letzter = z.created_at
                }
              } else {
                personCounts.set(z.person_id, { count: 1, letzter: z.created_at })
              }
            }

            // Map back to emails
            for (const pm of personenMatches) {
              if (pm.email) {
                const counts = personCounts.get(pm.id)
                if (counts) {
                  emailZuweisungCounts.set(pm.email.toLowerCase(), counts)
                }
              }
            }
          }
        }
      }

      // Track which emails are already in results (from intern query) to avoid duplicates
      const internEmails = new Set(
        results
          .filter((r) => r.typ === 'intern' && r.email)
          .map((r) => r.email!.toLowerCase())
      )

      for (const ext of externe) {
        const emailLower = ext.email?.toLowerCase()

        // Skip if this external helper already appears as intern (same email)
        if (emailLower && internEmails.has(emailLower)) {
          continue
        }

        // Count System B assignments (looked up via matching email)
        const systemBData = emailLower ? emailZuweisungCounts.get(emailLower) : undefined
        const totalCount = systemBData?.count || 0

        // Latest assignment from System B (overrides legacy `letzter_einsatz` if newer)
        let letzter = ext.letzter_einsatz
        if (systemBData?.letzter && (!letzter || systemBData.letzter > letzter)) {
          letzter = systemBData.letzter
        }

        results.push({
          id: ext.id,
          typ: 'extern',
          vorname: ext.vorname,
          nachname: ext.nachname,
          email: ext.email,
          telefon: ext.telefon,
          einsaetze_count: totalCount,
          letzter_einsatz: letzter,
        })
      }
    }
  }

  // Apply search filter
  const filtered = search
    ? results.filter((h) => {
        const sanitized = sanitizeSearchQuery(search).toLowerCase()
        const name = `${h.vorname} ${h.nachname}`.toLowerCase()
        const email = (h.email || '').toLowerCase()
        return name.includes(sanitized) || email.includes(sanitized)
      })
    : results

  // Sort
  filtered.sort((a, b) => {
    let cmp = 0
    switch (sortBy) {
      case 'name':
        cmp = `${a.nachname} ${a.vorname}`.localeCompare(
          `${b.nachname} ${b.vorname}`,
          'de'
        )
        break
      case 'einsaetze':
        cmp = a.einsaetze_count - b.einsaetze_count
        break
      case 'letzter_einsatz':
        cmp = (a.letzter_einsatz || '').localeCompare(
          b.letzter_einsatz || ''
        )
        break
    }
    return sortOrder === 'desc' ? -cmp : cmp
  })

  return filtered
}

/**
 * Delete a helper from the consolidated list.
 * - extern: deletes the externe_helfer_profile row
 * - intern: deletes all auffuehrung_zuweisungen for that person
 */
export async function deleteHelferFromList(
  id: string,
  typ: HelferTyp
): Promise<{ success: boolean; error?: string }> {
  await requirePermission('mitglieder:delete')

  const supabase = await createClient()

  if (typ === 'extern') {
    const { error } = await supabase
      .from('externe_helfer_profile')
      .delete()
      .eq('id', id)

    if (error) {
      return { success: false, error: error.message }
    }
  } else {
    const { error } = await supabase
      .from('auffuehrung_zuweisungen')
      .delete()
      .eq('person_id', id)

    if (error) {
      return { success: false, error: error.message }
    }
  }

  revalidatePath('/alle-helfer')
  return { success: true }
}

/**
 * Get all Einsätze (assignments) for a specific helper.
 * Queries System B (auffuehrung_zuweisungen).
 */
export async function getHelferEinsaetze(
  helferId: string,
  typ: HelferTyp
): Promise<{ success: boolean; data?: HelferEinsatzDetail[]; error?: string }> {
  try {
    await requirePermission('mitglieder:read')

    const supabase = await createClient()
    const results: HelferEinsatzDetail[] = []

    // System B: auffuehrung_zuweisungen
    const idField = typ === 'intern' ? 'person_id' : 'external_helper_id'
    const { data: zuweisungen, error: zuweisungenError } = await supabase
      .from('auffuehrung_zuweisungen')
      .select(`
        id,
        status,
        schicht:auffuehrung_schichten!inner(
          rolle,
          veranstaltung:veranstaltungen!inner(
            titel,
            datum,
            startzeit
          ),
          zeitblock:zeitbloecke(
            name,
            startzeit,
            endzeit
          )
        )
      `)
      .eq(idField, helferId)

    if (zuweisungenError) {
      console.error('Error fetching auffuehrung_zuweisungen:', zuweisungenError)
    } else if (zuweisungen) {
      for (const z of zuweisungen) {
        const schicht = z.schicht as unknown as {
          rolle: string
          veranstaltung: { titel: string; datum: string; startzeit: string | null }
          zeitblock: { name: string; startzeit: string; endzeit: string } | null
        }
        if (!schicht?.veranstaltung) continue

        results.push({
          id: z.id,
          veranstaltung: schicht.veranstaltung.titel,
          datum: schicht.veranstaltung.datum,
          rolle: schicht.rolle,
          zeitblock_start: schicht.zeitblock?.startzeit ?? schicht.veranstaltung.startzeit ?? null,
          zeitblock_end: schicht.zeitblock?.endzeit ?? null,
          status: z.status,
        })
      }
    }

    // Sort by datum descending (newest first)
    results.sort((a, b) => b.datum.localeCompare(a.datum))

    return { success: true, data: results }
  } catch (error) {
    console.error('getHelferEinsaetze failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unbekannter Fehler' }
  }
}

/**
 * Manually create a new external helper profile.
 * Used by Vorstand/Admin from the /alle-helfer page.
 */
export async function createHelferManual(data: {
  vorname: string
  nachname: string
  email?: string
  telefon?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission('veranstaltungen:write')

    const validated = helferErfassenSchema.parse(data)

    const supabase = await createClient()

    // Check for duplicate email if provided
    if (validated.email) {
      const { data: existing } = await supabase
        .from('externe_helfer_profile')
        .select('id')
        .ilike('email', validated.email)
        .maybeSingle()

      if (existing) {
        return {
          success: false,
          error: 'Ein Helfer mit dieser E-Mail-Adresse existiert bereits.',
        }
      }
    }

    const { error } = await supabase
      .from('externe_helfer_profile')
      .insert({
        vorname: validated.vorname,
        nachname: validated.nachname,
        email: validated.email || '',
        telefon: validated.telefon || null,
      })

    if (error) {
      console.error('Failed to create helper:', error)
      return { success: false, error: error.message }
    }

    revalidatePath('/alle-helfer')
    return { success: true }
  } catch (error) {
    console.error('createHelferManual failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
    }
  }
}

/**
 * Update an existing helper's details (internal or external).
 */
export async function updateHelfer(data: {
  id: string
  typ: HelferTyp
  vorname: string
  nachname: string
  email?: string
  telefon?: string
}): Promise<{ success: boolean; error?: string }> {
  try {
    await requirePermission('veranstaltungen:write')

    const validated = helferUpdateSchema.parse(data)

    const supabase = await createClient()

    if (validated.typ === 'extern') {
      const { error } = await supabase
        .from('externe_helfer_profile')
        .update({
          vorname: validated.vorname,
          nachname: validated.nachname,
          email: validated.email || '',
          telefon: validated.telefon || null,
        })
        .eq('id', validated.id)

      if (error) {
        console.error('Failed to update external helper:', error)
        return { success: false, error: error.message }
      }
    } else {
      const { error } = await supabase
        .from('personen')
        .update({
          vorname: validated.vorname,
          nachname: validated.nachname,
          email: validated.email || null,
          telefon: validated.telefon || null,
        })
        .eq('id', validated.id)

      if (error) {
        console.error('Failed to update internal helper:', error)
        return { success: false, error: error.message }
      }
    }

    revalidatePath('/alle-helfer')
    return { success: true }
  } catch (error) {
    console.error('updateHelfer failed:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
    }
  }
}
