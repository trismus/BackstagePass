'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../supabase/server'
import {
  onboardingProfileSchema,
  type OnboardingProfileData,
} from '../validations/onboarding'

export async function completeOnboarding(
  data: OnboardingProfileData
): Promise<{ success: boolean; error?: string }> {
  const validated = onboardingProfileSchema.parse(data)

  const supabase = await createClient()

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
    .maybeSingle()

  // Update personen fields if person exists
  if (person) {
    const { error: personError } = await supabase
      .from('personen')
      .update({
        telefon: validated.telefon ?? null,
        notfallkontakt_name: validated.notfallkontakt_name ?? null,
        notfallkontakt_telefon: validated.notfallkontakt_telefon ?? null,
        notfallkontakt_beziehung: validated.notfallkontakt_beziehung ?? null,
        skills: validated.skills ?? [],
      } as never)
      .eq('id', person.id)

    if (personError) {
      console.error('Error updating person during onboarding:', personError)
      return { success: false, error: personError.message }
    }
  }

  // Mark onboarding as completed
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ onboarding_completed: true } as never)
    .eq('id', user.id)

  if (profileError) {
    console.error('Error completing onboarding:', profileError)
    return { success: false, error: profileError.message }
  }

  revalidatePath('/willkommen')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function skipOnboarding(): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Nicht angemeldet' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ onboarding_completed: true } as never)
    .eq('id', user.id)

  if (error) {
    console.error('Error skipping onboarding:', error)
    return { success: false, error: error.message }
  }

  revalidatePath('/willkommen')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function getOnboardingPersonData(): Promise<{
  vorname: string
  telefon: string | null
  notfallkontakt_name: string | null
  notfallkontakt_telefon: string | null
  notfallkontakt_beziehung: string | null
  skills: string[]
} | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', user.id)
    .single()

  if (!profile?.email) return null

  const { data: person } = await supabase
    .from('personen')
    .select(
      'vorname, telefon, notfallkontakt_name, notfallkontakt_telefon, notfallkontakt_beziehung, skills'
    )
    .eq('email', profile.email)
    .maybeSingle()

  if (!person) return null

  return {
    vorname: person.vorname,
    telefon: person.telefon,
    notfallkontakt_name: person.notfallkontakt_name,
    notfallkontakt_telefon: person.notfallkontakt_telefon,
    notfallkontakt_beziehung: person.notfallkontakt_beziehung,
    skills: (person.skills as string[]) ?? [],
  }
}
