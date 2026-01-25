'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../supabase/server'
import { dummyPersonen, getPersonById, searchPersonen } from '../personen/data'
import type { Person, PersonInsert, PersonUpdate } from '../supabase/types'

const USE_DUMMY_DATA = !process.env.NEXT_PUBLIC_SUPABASE_URL

/**
 * Get all personen
 */
export async function getPersonen(): Promise<Person[]> {
  if (USE_DUMMY_DATA) {
    return dummyPersonen
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('personen')
    .select('*')
    .order('nachname', { ascending: true })

  if (error) {
    console.error('Error fetching personen:', error)
    return dummyPersonen
  }

  return (data as Person[]) || dummyPersonen
}

/**
 * Get a single person by ID
 */
export async function getPerson(id: string): Promise<Person | null> {
  if (USE_DUMMY_DATA) {
    return getPersonById(id) || null
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('personen')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching person:', error)
    return getPersonById(id) || null
  }

  return data as Person
}

/**
 * Search personen by query
 */
export async function searchPersonenAction(query: string): Promise<Person[]> {
  if (USE_DUMMY_DATA) {
    return searchPersonen(query)
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('personen')
    .select('*')
    .or(`vorname.ilike.%${query}%,nachname.ilike.%${query}%,email.ilike.%${query}%`)
    .order('nachname', { ascending: true })

  if (error) {
    console.error('Error searching personen:', error)
    return searchPersonen(query)
  }

  return (data as Person[]) || []
}

/**
 * Create a new person
 */
export async function createPerson(
  personData: PersonInsert
): Promise<{ success: boolean; error?: string }> {
  if (USE_DUMMY_DATA) {
    // In dummy mode, just pretend it worked
    revalidatePath('/mitglieder')
    return { success: true }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('personen').insert(personData as never)

  if (error) {
    console.error('Error creating person:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/mitglieder')
  return { success: true }
}

/**
 * Update an existing person
 */
export async function updatePerson(
  id: string,
  personData: PersonUpdate
): Promise<{ success: boolean; error?: string }> {
  if (USE_DUMMY_DATA) {
    revalidatePath('/mitglieder')
    revalidatePath(`/mitglieder/${id}`)
    return { success: true }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('personen')
    .update(personData as never)
    .eq('id', id)

  if (error) {
    console.error('Error updating person:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/mitglieder')
  revalidatePath(`/mitglieder/${id}`)
  return { success: true }
}

/**
 * Delete a person (soft delete - set aktiv to false)
 */
export async function deletePerson(
  id: string
): Promise<{ success: boolean; error?: string }> {
  if (USE_DUMMY_DATA) {
    revalidatePath('/mitglieder')
    return { success: true }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('personen')
    .update({ aktiv: false } as never)
    .eq('id', id)

  if (error) {
    console.error('Error deleting person:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/mitglieder')
  return { success: true }
}
