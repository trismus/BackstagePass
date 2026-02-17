import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPerson } from '@/lib/actions/personen'
import { getPersonalEvents, getPersonVerfuegbarkeiten } from '@/lib/actions/persoenlicher-kalender'
import { getPersonEngagements } from '@/lib/actions/person-engagements'
import { getUserProfile } from '@/lib/supabase/server'
import { isManagement } from '@/lib/supabase/permissions'
import { MitgliedForm } from '@/components/mitglieder/MitgliedForm'
import { InviteButton } from '@/components/mitglieder/InviteButton'
import { PersonalCalendar } from '@/components/mein-bereich/PersonalCalendar'
import { PersonEngagementHistory } from '@/components/mitglieder/PersonEngagementHistory'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function MitgliedEditPage({ params }: PageProps) {
  const { id } = await params
  const person = await getPerson(id)

  if (!person) {
    notFound()
  }

  // Fetch calendar data for the person (12-month range)
  const today = new Date()
  const startDatum = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    .toISOString()
    .split('T')[0]
  const endDatum = new Date(today.getFullYear() + 1, today.getMonth(), 0)
    .toISOString()
    .split('T')[0]

  const [events, verfuegbarkeiten, profile] = await Promise.all([
    getPersonalEvents(startDatum, endDatum, id),
    getPersonVerfuegbarkeiten(id, startDatum, endDatum),
    getUserProfile(),
  ])

  const showEngagements = profile && isManagement(profile.role)
  const engagements = showEngagements
    ? await getPersonEngagements(id)
    : null

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/mitglieder"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            &larr; Zurück zur Liste
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            {person.vorname} {person.nachname}
          </h1>
          <p className="mt-1 text-gray-600">Mitglied bearbeiten</p>
        </div>

        {/* Invite banner for members without app access */}
        {!person.profile_id && person.email && (
          <div className="mb-6">
            <InviteButton
              personId={id}
              personRolle={person.rolle}
              personEmail={person.email}
              invitedAt={person.invited_at}
              invitationAcceptedAt={person.invitation_accepted_at}
            />
          </div>
        )}

        {/* Form */}
        <div className="rounded-lg bg-white p-6 shadow">
          <MitgliedForm person={person} mode="edit" />
        </div>

        {/* Calendar Section */}
        {events.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              Einsatzübersicht
            </h2>
            <PersonalCalendar
              initialEvents={events}
              verfuegbarkeiten={verfuegbarkeiten}
              readOnly
            />
          </div>
        )}

        {/* Engagement History (Management only) */}
        {showEngagements && engagements && (
          <div className="mt-8">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              Rollen- und Einsatzhistorie
            </h2>
            <PersonEngagementHistory engagements={engagements} />
          </div>
        )}
      </div>
    </main>
  )
}
