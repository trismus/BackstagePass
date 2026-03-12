import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUserProfile } from '@/lib/supabase/server'
import { ROLE_START_PAGES } from '@/lib/navigation'
import { OnboardingWizard } from '@/components/onboarding/OnboardingWizard'
import { getOnboardingPersonData } from '@/lib/actions/onboarding'

export default async function WillkommenPage() {
  const profile = await getUserProfile()

  if (!profile) {
    redirect('/login')
  }

  const startPage = ROLE_START_PAGES[profile.role]

  // Case 1: Onboarding not completed → show wizard
  if (!profile.onboarding_completed) {
    const personData = await getOnboardingPersonData()

    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <OnboardingWizard
          displayName={profile.display_name}
          vorname={personData?.vorname ?? null}
          initialData={
            personData
              ? {
                  telefon: personData.telefon,
                  notfallkontakt_name: personData.notfallkontakt_name,
                  notfallkontakt_telefon: personData.notfallkontakt_telefon,
                  notfallkontakt_beziehung:
                    personData.notfallkontakt_beziehung,
                  skills: personData.skills,
                }
              : null
          }
          startPage={startPage}
        />
      </div>
    )
  }

  // Case 2: Onboarding completed + FREUNDE → show static welcome page
  if (profile.role === 'FREUNDE') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            Willkommen bei BackstagePass
          </h1>
          <p className="mt-1 text-neutral-600">
            Das Verwaltungssystem der Theatergruppe Widen
          </p>
        </div>

        {/* Welcome Card */}
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-neutral-900">
            Hallo{profile.display_name ? ` ${profile.display_name}` : ''}!
          </h2>
          <p className="mb-4 text-neutral-600">
            Du bist als Freund der Theatergruppe Widen registriert. Hier kannst
            du unsere aktuellen Veranstaltungen einsehen und dich über unser
            Programm informieren.
          </p>
          <p className="text-neutral-600">
            Möchtest du aktiver mitmachen? Wende dich gerne an uns - wir freuen
            uns immer über neue Helfer und Mitglieder!
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            href="/veranstaltungen"
            className="rounded-xl border border-neutral-200 bg-white p-6 transition-colors hover:border-neutral-300"
          >
            <h3 className="mb-2 font-semibold text-neutral-900">
              Veranstaltungen
            </h3>
            <p className="text-sm text-neutral-600">
              Aktuelle und kommende Veranstaltungen der TGW
            </p>
          </Link>

          <Link
            href="/profile"
            className="rounded-xl border border-neutral-200 bg-white p-6 transition-colors hover:border-neutral-300"
          >
            <h3 className="mb-2 font-semibold text-neutral-900">
              Mein Profil
            </h3>
            <p className="text-sm text-neutral-600">
              Deine Kontaktdaten und Einstellungen verwalten
            </p>
          </Link>
        </div>

        {/* CTA for becoming a member */}
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
          <h3 className="font-semibold text-blue-900">
            Interesse am Mitmachen?
          </h3>
          <p className="mt-2 text-sm text-blue-700">
            Wir freuen uns immer über neue Gesichter! Ob als Helfer bei
            Veranstaltungen oder als aktives Mitglied - bei uns ist jeder
            willkommen.
          </p>
        </div>
      </div>
    )
  }

  // Case 3: Onboarding completed + non-FREUNDE → redirect to start page
  redirect(startPage as never)
}
