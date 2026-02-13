import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { getMeetingByVeranstaltung } from '@/lib/actions/meetings'
import { canEdit as checkCanEdit } from '@/lib/supabase/auth-helpers'
import { MeetingDetail } from '@/components/meetings'

interface MeetingDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function MeetingDetailPage({ params }: MeetingDetailPageProps) {
  const { id } = await params
  const profile = await getUserProfile()
  const canEdit = profile ? checkCanEdit(profile.role) : false

  const meeting = await getMeetingByVeranstaltung(id)
  if (!meeting) {
    notFound()
  }

  const supabase = await createClient()

  // Hole alle Personen fuer Auswahllisten
  const { data: personen } = await supabase
    .from('personen')
    .select('id, vorname, nachname, strasse, plz, ort, geburtstag, email, telefon, rolle, aktiv, notizen, notfallkontakt_name, notfallkontakt_telefon, notfallkontakt_beziehung, profilbild_url, biografie, mitglied_seit, austrittsdatum, austrittsgrund, skills, telefon_nummern, bevorzugte_kontaktart, social_media, kontakt_notizen, archiviert_am, archiviert_von, created_at, updated_at')
    .eq('aktiv', true)
    .order('nachname')

  return (
    <MeetingDetail
      meeting={meeting}
      personen={personen || []}
      canEdit={canEdit}
    />
  )
}
