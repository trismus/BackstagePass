import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/supabase/server'
import { canEdit as checkCanEdit } from '@/lib/supabase/auth-helpers'
import { redirect } from 'next/navigation'
import { MeetingForm } from '@/components/meetings'

export default async function NeuesMeetingPage() {
  const profile = await getUserProfile()
  const canEdit = profile ? checkCanEdit(profile.role) : false

  if (!canEdit) {
    redirect('/meetings')
  }

  const supabase = await createClient()

  // Hole alle Personen fuer Auswahllisten
  const { data: personen } = await supabase
    .from('personen')
    .select('id, vorname, nachname, strasse, plz, ort, geburtstag, email, telefon, rolle, aktiv, notizen, notfallkontakt_name, notfallkontakt_telefon, notfallkontakt_beziehung, profilbild_url, biografie, mitglied_seit, austrittsdatum, austrittsgrund, skills, telefon_nummern, bevorzugte_kontaktart, social_media, kontakt_notizen, archiviert_am, archiviert_von, created_at, updated_at, profile_id, invited_at, invitation_accepted_at')
    .eq('aktiv', true)
    .order('nachname')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Neues Meeting</h1>
        <p className="mt-1 text-gray-600">
          Erstellen Sie ein neues Meeting mit Traktanden und Protokoll
        </p>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        <MeetingForm personen={personen || []} />
      </div>
    </div>
  )
}
