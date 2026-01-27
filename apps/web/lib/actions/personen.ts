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

/**
 * Update own profile data (for mein-bereich)
 * Only allows updating certain fields and validates ownership
 */
export async function updateOwnProfile(
  personData: Pick<PersonUpdate, 'telefon' | 'strasse' | 'plz' | 'ort'>
): Promise<{ success: boolean; error?: string }> {
  if (USE_DUMMY_DATA) {
    revalidatePath('/mein-bereich')
    return { success: true }
  }

  const supabase = await createClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Nicht angemeldet' }
  }

  // Get the user's profile to find their email
  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', user.id)
    .single()

  if (!profile?.email) {
    return { success: false, error: 'Profil nicht gefunden' }
  }

  // Find the person linked to this email
  const { data: person } = await supabase
    .from('personen')
    .select('id')
    .eq('email', profile.email)
    .single()

  if (!person) {
    return { success: false, error: 'Kein Mitgliederprofil verknüpft' }
  }

  // Update only allowed fields
  const { error } = await supabase
    .from('personen')
    .update({
      telefon: personData.telefon,
      strasse: personData.strasse,
      plz: personData.plz,
      ort: personData.ort,
    } as never)
    .eq('id', person.id)

  if (error) {
    console.error('Error updating own profile:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/mein-bereich')
  return { success: true }
}

// =============================================================================
// Archive Functions (Issue #5 Mitglieder)
// =============================================================================

export type ArchiveFilter = 'alle' | 'aktiv' | 'archiviert'

/**
 * Get all personen with optional filter for archive status
 */
export async function getPersonenFiltered(
  filter: ArchiveFilter = 'aktiv'
): Promise<Person[]> {
  if (USE_DUMMY_DATA) {
    const filtered = dummyPersonen.filter((p) => {
      if (filter === 'aktiv') return p.aktiv
      if (filter === 'archiviert') return !p.aktiv
      return true
    })
    return filtered
  }

  const supabase = await createClient()

  let query = supabase.from('personen').select('*')

  if (filter === 'aktiv') {
    query = query.eq('aktiv', true)
  } else if (filter === 'archiviert') {
    query = query.eq('aktiv', false)
  }

  const { data, error } = await query.order('nachname', { ascending: true })

  if (error) {
    console.error('Error fetching personen:', error)
    return dummyPersonen
  }

  return (data as Person[]) || []
}

/**
 * Archive a member (soft delete with audit trail)
 */
export async function archiveMitglied(
  id: string,
  austrittsgrund?: string
): Promise<{ success: boolean; error?: string }> {
  if (USE_DUMMY_DATA) {
    revalidatePath('/mitglieder')
    return { success: true }
  }

  const supabase = await createClient()

  // Get current user ID for audit
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('personen')
    .update({
      aktiv: false,
      archiviert_am: new Date().toISOString(),
      archiviert_von: user?.id || null,
      austrittsdatum: new Date().toISOString().split('T')[0],
      austrittsgrund: austrittsgrund || null,
    } as never)
    .eq('id', id)

  if (error) {
    console.error('Error archiving member:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/mitglieder')
  revalidatePath(`/mitglieder/${id}`)
  return { success: true }
}

/**
 * Reactivate an archived member
 */
export async function reactivateMitglied(
  id: string
): Promise<{ success: boolean; error?: string }> {
  if (USE_DUMMY_DATA) {
    revalidatePath('/mitglieder')
    return { success: true }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('personen')
    .update({
      aktiv: true,
      archiviert_am: null,
      archiviert_von: null,
      // Keep austrittsdatum and grund for history
    } as never)
    .eq('id', id)

  if (error) {
    console.error('Error reactivating member:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/mitglieder')
  revalidatePath(`/mitglieder/${id}`)
  return { success: true }
}

/**
 * Get archive statistics
 */
export async function getMitgliederStatistik(): Promise<{
  aktive: number
  archivierte: number
  gesamt: number
}> {
  if (USE_DUMMY_DATA) {
    const aktive = dummyPersonen.filter((p) => p.aktiv).length
    const archivierte = dummyPersonen.filter((p) => !p.aktiv).length
    return { aktive, archivierte, gesamt: dummyPersonen.length }
  }

  const supabase = await createClient()

  const { data: aktiveData } = await supabase
    .from('personen')
    .select('id', { count: 'exact' })
    .eq('aktiv', true)

  const { data: archiviertData } = await supabase
    .from('personen')
    .select('id', { count: 'exact' })
    .eq('aktiv', false)

  const aktive = aktiveData?.length || 0
  const archivierte = archiviertData?.length || 0

  return {
    aktive,
    archivierte,
    gesamt: aktive + archivierte,
  }
}
