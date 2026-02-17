'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../supabase/server'
import { createAdminClient } from '../supabase/admin'
import { requirePermission } from '../supabase/auth-helpers'
import { dummyPersonen, getPersonById, searchPersonen } from '../personen/data'
import type {
  Person,
  PersonInsert,
  PersonUpdate,
  Rolle,
  UserRole,
} from '../supabase/types'
import { sanitizeSearchQuery } from '../utils/search'
import { getDefaultAppRole } from '../utils/roles'

const USE_DUMMY_DATA = !process.env.NEXT_PUBLIC_SUPABASE_URL

/**
 * Get all personen
 */
export async function getPersonen(): Promise<Person[]> {
  await requirePermission('mitglieder:read')

  if (USE_DUMMY_DATA) {
    return dummyPersonen
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('personen')
    .select('id, vorname, nachname, strasse, plz, ort, geburtstag, email, telefon, rolle, aktiv, notizen, notfallkontakt_name, notfallkontakt_telefon, notfallkontakt_beziehung, profilbild_url, biografie, mitglied_seit, austrittsdatum, austrittsgrund, skills, telefon_nummern, bevorzugte_kontaktart, social_media, kontakt_notizen, archiviert_am, archiviert_von, created_at, updated_at, profile_id, invited_at, invitation_accepted_at')
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
  await requirePermission('mitglieder:read')

  if (USE_DUMMY_DATA) {
    return getPersonById(id) || null
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('personen')
    .select('id, vorname, nachname, strasse, plz, ort, geburtstag, email, telefon, rolle, aktiv, notizen, notfallkontakt_name, notfallkontakt_telefon, notfallkontakt_beziehung, profilbild_url, biografie, mitglied_seit, austrittsdatum, austrittsgrund, skills, telefon_nummern, bevorzugte_kontaktart, social_media, kontakt_notizen, archiviert_am, archiviert_von, created_at, updated_at, profile_id, invited_at, invitation_accepted_at')
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
  await requirePermission('mitglieder:read')

  if (USE_DUMMY_DATA) {
    return searchPersonen(query)
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('personen')
    .select('id, vorname, nachname, strasse, plz, ort, geburtstag, email, telefon, rolle, aktiv, notizen, notfallkontakt_name, notfallkontakt_telefon, notfallkontakt_beziehung, profilbild_url, biografie, mitglied_seit, austrittsdatum, austrittsgrund, skills, telefon_nummern, bevorzugte_kontaktart, social_media, kontakt_notizen, archiviert_am, archiviert_von, created_at, updated_at, profile_id, invited_at, invitation_accepted_at')
    .or(
      `vorname.ilike.%${sanitizeSearchQuery(query)}%,nachname.ilike.%${sanitizeSearchQuery(query)}%,email.ilike.%${sanitizeSearchQuery(query)}%`
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
  await requirePermission('mitglieder:write')

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
  await requirePermission('mitglieder:write')

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

    // Track invitation timestamp
    await adminClient
      .from('personen')
      .update({ invited_at: new Date().toISOString() } as never)
      .eq('email', personData.email)
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
 * Invite an existing person to the app (create auth account)
 * For members who were created without app access
 */
export async function inviteExistingPerson(
  personId: string,
  appRole: UserRole
): Promise<{ success: boolean; error?: string }> {
  await requirePermission('mitglieder:write')

  if (USE_DUMMY_DATA) {
    return { success: true }
  }

  const supabase = await createClient()

  // Load the person
  const { data: person, error: fetchError } = await supabase
    .from('personen')
    .select('id, vorname, nachname, email, profile_id')
    .eq('id', personId)
    .single()

  if (fetchError || !person) {
    return { success: false, error: 'Person nicht gefunden' }
  }

  if (!person.email) {
    return { success: false, error: 'E-Mail ist erforderlich für App-Zugang' }
  }

  if (person.profile_id) {
    return { success: false, error: 'Person hat bereits einen App-Zugang' }
  }

  try {
    const adminClient = createAdminClient()

    const { data: inviteData, error: inviteError } =
      await adminClient.auth.admin.inviteUserByEmail(person.email, {
        data: {
          display_name: `${person.vorname} ${person.nachname}`,
        },
      })

    if (inviteError) {
      console.error('Error inviting user:', inviteError)
      return {
        success: false,
        error: `Einladung fehlgeschlagen: ${inviteError.message}`,
      }
    }

    // Update the profile role (profile is created by trigger)
    if (inviteData.user) {
      const { error: profileError } = await adminClient
        .from('profiles')
        .update({ role: appRole })
        .eq('id', inviteData.user.id)

      if (profileError) {
        console.error('Error updating profile role:', profileError)
      }
    }

    // Track invitation timestamp
    await adminClient
      .from('personen')
      .update({ invited_at: new Date().toISOString() } as never)
      .eq('id', personId)
  } catch (err) {
    console.error('Error in invite flow:', err)
    return {
      success: false,
      error:
        'App-Zugang konnte nicht erstellt werden. Ist SUPABASE_SERVICE_ROLE_KEY konfiguriert?',
    }
  }

  revalidatePath('/mitglieder')
  revalidatePath(`/mitglieder/${personId}`)
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
  await requirePermission('mitglieder:write')

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
  await requirePermission('mitglieder:delete')

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
    revalidatePath('/dashboard')
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
  await requirePermission('mitglieder:read')

  if (USE_DUMMY_DATA) {
    const filtered = dummyPersonen.filter((p) => {
      if (filter === 'aktiv') return p.aktiv
      if (filter === 'archiviert') return !p.aktiv
      return true
    })
    return filtered
  }

  const supabase = await createClient()

  let query = supabase.from('personen').select('id, vorname, nachname, strasse, plz, ort, geburtstag, email, telefon, rolle, aktiv, notizen, notfallkontakt_name, notfallkontakt_telefon, notfallkontakt_beziehung, profilbild_url, biografie, mitglied_seit, austrittsdatum, austrittsgrund, skills, telefon_nummern, bevorzugte_kontaktart, social_media, kontakt_notizen, archiviert_am, archiviert_von, created_at, updated_at, profile_id, invited_at, invitation_accepted_at')

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

// =============================================================================
// Advanced Filter (Issue #154)
// =============================================================================

export type SortField = 'name' | 'mitglied_seit' | 'rolle'
export type SortOrder = 'asc' | 'desc'

export interface MitgliederFilterParams {
  search?: string
  status?: ArchiveFilter
  rolle?: string[]
  skills?: string[]
  sortBy?: SortField
  sortOrder?: SortOrder
}

/**
 * Get personen with advanced filtering and sorting
 */
export async function getPersonenAdvanced(
  params: MitgliederFilterParams = {}
): Promise<Person[]> {
  await requirePermission('mitglieder:read')

  const {
    search = '',
    status = 'aktiv',
    rolle = [],
    skills = [],
    sortBy = 'name',
    sortOrder = 'asc',
  } = params

  if (USE_DUMMY_DATA) {
    const filtered = dummyPersonen.filter((p) => {
      // Status filter
      if (status === 'aktiv' && !p.aktiv) return false
      if (status === 'archiviert' && p.aktiv) return false

      // Search filter
      if (search) {
        const searchLower = search.toLowerCase()
        const matchesSearch =
          p.vorname.toLowerCase().includes(searchLower) ||
          p.nachname.toLowerCase().includes(searchLower) ||
          p.email?.toLowerCase().includes(searchLower)
        if (!matchesSearch) return false
      }

      // Rolle filter
      if (rolle.length > 0 && !rolle.includes(p.rolle)) return false

      // Skills filter
      if (skills.length > 0) {
        const personSkills = p.skills || []
        const hasMatchingSkill = skills.some((s) => personSkills.includes(s))
        if (!hasMatchingSkill) return false
      }

      return true
    })

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0
      if (sortBy === 'name') {
        comparison = `${a.nachname} ${a.vorname}`.localeCompare(
          `${b.nachname} ${b.vorname}`
        )
      } else if (sortBy === 'mitglied_seit') {
        const dateA = a.mitglied_seit || '9999'
        const dateB = b.mitglied_seit || '9999'
        comparison = dateA.localeCompare(dateB)
      } else if (sortBy === 'rolle') {
        comparison = a.rolle.localeCompare(b.rolle)
      }
      return sortOrder === 'desc' ? -comparison : comparison
    })

    return filtered
  }

  const supabase = await createClient()

  let query = supabase.from('personen').select('id, vorname, nachname, strasse, plz, ort, geburtstag, email, telefon, rolle, aktiv, notizen, notfallkontakt_name, notfallkontakt_telefon, notfallkontakt_beziehung, profilbild_url, biografie, mitglied_seit, austrittsdatum, austrittsgrund, skills, telefon_nummern, bevorzugte_kontaktart, social_media, kontakt_notizen, archiviert_am, archiviert_von, created_at, updated_at, profile_id, invited_at, invitation_accepted_at')

  // Status filter
  if (status === 'aktiv') {
    query = query.eq('aktiv', true)
  } else if (status === 'archiviert') {
    query = query.eq('aktiv', false)
  }

  // Search filter (use ilike for case-insensitive search)
  if (search) {
    const sanitized = sanitizeSearchQuery(search)
    query = query.or(
      `vorname.ilike.%${sanitized}%,nachname.ilike.%${sanitized}%,email.ilike.%${sanitized}%`
    )
  }

  // Rolle filter
  if (rolle.length > 0) {
    query = query.in('rolle', rolle)
  }

  // Skills filter (JSONB array contains)
  if (skills.length > 0) {
    // Use overlaps operator for JSONB arrays
    query = query.overlaps('skills', skills)
  }

  // Sorting
  const ascending = sortOrder === 'asc'
  if (sortBy === 'name') {
    query = query.order('nachname', { ascending }).order('vorname', { ascending })
  } else if (sortBy === 'mitglied_seit') {
    query = query.order('mitglied_seit', { ascending, nullsFirst: false })
  } else if (sortBy === 'rolle') {
    query = query.order('rolle', { ascending })
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching personen:', error)
    return []
  }

  return (data as Person[]) || []
}

/**
 * Get unique skills from all personen (for filter dropdown)
 */
export async function getAllSkills(): Promise<string[]> {
  await requirePermission('mitglieder:read')

  if (USE_DUMMY_DATA) {
    const allSkills = new Set<string>()
    dummyPersonen.forEach((p) => {
      p.skills?.forEach((s) => allSkills.add(s))
    })
    return Array.from(allSkills).sort()
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('personen')
    .select('skills')
    .not('skills', 'is', null)

  if (error) {
    console.error('Error fetching skills:', error)
    return []
  }

  const allSkills = new Set<string>()
  data?.forEach((row) => {
    const skills = row.skills as string[] | null
    skills?.forEach((s) => allSkills.add(s))
  })

  return Array.from(allSkills).sort()
}

/**
 * Archive a member (soft delete with audit trail)
 */
export async function archiveMitglied(
  id: string,
  austrittsgrund?: string
): Promise<{ success: boolean; error?: string }> {
  await requirePermission('mitglieder:write')

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
  await requirePermission('mitglieder:write')

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
  await requirePermission('mitglieder:read')

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

// =============================================================================
// Invitation Resend (Issue #325)
// =============================================================================

const RESEND_COOLDOWN_DAYS = 7

/**
 * Resend an invitation to a person who was already invited but hasn't accepted
 */
export async function resendInvitation(
  personId: string
): Promise<{ success: boolean; error?: string }> {
  await requirePermission('mitglieder:write')

  if (USE_DUMMY_DATA) {
    return { success: true }
  }

  const supabase = await createClient()

  // Load the person
  const { data: person, error: fetchError } = await supabase
    .from('personen')
    .select('id, vorname, nachname, email, profile_id, invited_at, invitation_accepted_at')
    .eq('id', personId)
    .single()

  if (fetchError || !person) {
    return { success: false, error: 'Person nicht gefunden' }
  }

  if (!person.email) {
    return { success: false, error: 'E-Mail ist erforderlich' }
  }

  if (person.invitation_accepted_at || person.profile_id) {
    return { success: false, error: 'Einladung wurde bereits angenommen' }
  }

  if (!person.invited_at) {
    return { success: false, error: 'Noch keine Einladung gesendet' }
  }

  // Check cooldown
  const invitedDate = new Date(person.invited_at)
  const daysSinceInvite = Math.floor(
    (Date.now() - invitedDate.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (daysSinceInvite < RESEND_COOLDOWN_DAYS) {
    const remaining = RESEND_COOLDOWN_DAYS - daysSinceInvite
    return {
      success: false,
      error: `Erneutes Senden erst in ${remaining} Tag${remaining !== 1 ? 'en' : ''} möglich`,
    }
  }

  try {
    const adminClient = createAdminClient()

    const { error: inviteError } =
      await adminClient.auth.admin.inviteUserByEmail(person.email, {
        data: {
          display_name: `${person.vorname} ${person.nachname}`,
        },
      })

    if (inviteError) {
      console.error('Error resending invitation:', inviteError)
      return {
        success: false,
        error: `Einladung fehlgeschlagen: ${inviteError.message}`,
      }
    }

    // Update invited_at timestamp
    await adminClient
      .from('personen')
      .update({ invited_at: new Date().toISOString() } as never)
      .eq('id', personId)
  } catch (err) {
    console.error('Error in resend flow:', err)
    return {
      success: false,
      error: 'Einladung konnte nicht gesendet werden. Ist SUPABASE_SERVICE_ROLE_KEY konfiguriert?',
    }
  }

  revalidatePath('/mitglieder')
  revalidatePath(`/mitglieder/${personId}`)
  return { success: true }
}

// =============================================================================
// Bulk Invite (Issue #327)
// =============================================================================

export interface BulkInviteResult {
  total: number
  successful: number
  failed: number
  errors: { personId: string; name: string; error: string }[]
}

/**
 * Invite multiple persons to the app in bulk
 * Only invites persons with email and without existing profile_id
 */
export async function bulkInvitePersons(
  personIds: string[]
): Promise<BulkInviteResult> {
  await requirePermission('mitglieder:write')

  if (personIds.length === 0) {
    return { total: 0, successful: 0, failed: 0, errors: [] }
  }

  const supabase = await createClient()

  // Fetch all persons in one query
  const { data: persons, error: fetchError } = await supabase
    .from('personen')
    .select('id, vorname, nachname, email, rolle, aktiv, profile_id, invited_at')
    .in('id', personIds)

  if (fetchError || !persons) {
    return {
      total: personIds.length,
      successful: 0,
      failed: personIds.length,
      errors: [{ personId: '', name: '', error: 'Fehler beim Laden der Personen' }],
    }
  }

  // Filter to only invitable persons (has email, no profile_id, active)
  const invitable = persons.filter(
    (p) => p.email && !p.profile_id && p.aktiv
  )

  const result: BulkInviteResult = {
    total: invitable.length,
    successful: 0,
    failed: 0,
    errors: [],
  }

  const adminClient = createAdminClient()

  // Sequential invites to avoid rate limiting
  for (const person of invitable) {
    const name = `${person.vorname} ${person.nachname}`
    try {
      const appRole = getDefaultAppRole(person.rolle as Rolle)

      const { data: inviteData, error: inviteError } =
        await adminClient.auth.admin.inviteUserByEmail(person.email!, {
          data: { display_name: name },
        })

      if (inviteError) {
        result.failed++
        result.errors.push({
          personId: person.id,
          name,
          error: inviteError.message,
        })
        continue
      }

      // Update profile role
      if (inviteData.user) {
        await adminClient
          .from('profiles')
          .update({ role: appRole })
          .eq('id', inviteData.user.id)
      }

      // Track invitation timestamp
      await adminClient
        .from('personen')
        .update({ invited_at: new Date().toISOString() } as never)
        .eq('id', person.id)

      result.successful++
    } catch (err) {
      result.failed++
      result.errors.push({
        personId: person.id,
        name,
        error: err instanceof Error ? err.message : 'Unbekannter Fehler',
      })
    }
  }

  revalidatePath('/mitglieder')
  revalidatePath('/admin/users')

  return result
}
