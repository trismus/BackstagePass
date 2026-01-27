'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../supabase/server'
import { createAdminClient } from '../supabase/admin'
import { dummyPersonen, getPersonById, searchPersonen } from '../personen/data'
import type {
  Person,
  PersonInsert,
  PersonUpdate,
  UserRole,
} from '../supabase/types'

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
    .or(
      `vorname.ilike.%${query}%,nachname.ilike.%${query}%,email.ilike.%${query}%`
    )
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
 * Create a new person with an app account
 * This will:
 * 1. Create the person in the personen table
 * 2. Invite the user via email (creates auth.users entry)
 * 3. Set the profile role
 */
export async function createPersonWithAccount(
  personData: PersonInsert,
  appRole: UserRole
): Promise<{ success: boolean; error?: string }> {
  if (!personData.email) {
    return { success: false, error: 'E-Mail ist erforderlich für App-Zugang' }
  }

  if (USE_DUMMY_DATA) {
    revalidatePath('/mitglieder')
    return { success: true }
  }

  const supabase = await createClient()

  // 1. Create the person
  const { error: personError } = await supabase
    .from('personen')
    .insert(personData as never)

  if (personError) {
    console.error('Error creating person:', personError)
    return { success: false, error: personError.message }
  }

  // 2. Invite the user via Supabase Auth (requires service role)
  try {
    const adminClient = createAdminClient()

    const { data: inviteData, error: inviteError } =
      await adminClient.auth.admin.inviteUserByEmail(personData.email, {
        data: {
          display_name: `${personData.vorname} ${personData.nachname}`,
        },
      })

    if (inviteError) {
      console.error('Error inviting user:', inviteError)
      // Person was created, but invite failed - still return success with warning
      return {
        success: true,
        error: `Mitglied erstellt, aber Einladung fehlgeschlagen: ${inviteError.message}`,
      }
    }

    // 3. Update the profile role (profile is created by trigger)
    if (inviteData.user) {
      const { error: profileError } = await adminClient
        .from('profiles')
        .update({ role: appRole })
        .eq('id', inviteData.user.id)

      if (profileError) {
        console.error('Error updating profile role:', profileError)
        // Don't fail - the user can still be updated later
      }
    }
  } catch (err) {
    console.error('Error in invite flow:', err)
    return {
      success: true,
      error:
        'Mitglied erstellt, aber App-Zugang konnte nicht erstellt werden. Ist SUPABASE_SERVICE_ROLE_KEY konfiguriert?',
    }
  }

  revalidatePath('/mitglieder')
  revalidatePath('/admin/users')
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
