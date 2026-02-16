'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../supabase/server'
import { requirePermission } from '../supabase/auth-helpers'
import { sanitizeSearchQuery } from '../utils/search'

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
        id, vorname, nachname, email, telefon, letzter_einsatz,
        anmeldungen:helfer_anmeldungen(id)
      `)

    if (externeError) {
      console.error('Error fetching external helpers:', externeError)
    } else if (externe) {
      for (const ext of externe) {
        results.push({
          id: ext.id,
          typ: 'extern',
          vorname: ext.vorname,
          nachname: ext.nachname,
          email: ext.email,
          telefon: ext.telefon,
          einsaetze_count: (ext.anmeldungen as unknown[] | null)?.length || 0,
          letzter_einsatz: ext.letzter_einsatz,
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
