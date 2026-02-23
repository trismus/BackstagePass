import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPerson } from '@/lib/actions/personen'
import { getPersonDetailData } from '@/lib/actions/mitglieder-integration'
import { MitgliedForm } from '@/components/mitglieder/MitgliedForm'
import { InviteButton } from '@/components/mitglieder/InviteButton'
import { PersonAssignments } from '@/components/mitglieder/PersonAssignments'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function MitgliedEditPage({ params }: PageProps) {
  const { id } = await params
  const person = await getPerson(id)

  if (!person) {
    notFound()
  }

  const detailData = await getPersonDetailData(id)

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
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

        {/* Stats Overview */}
        {detailData && (
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg bg-white p-4 shadow">
              <p className="text-2xl font-bold text-purple-600">{detailData.stats.total_besetzungen}</p>
              <p className="text-sm text-gray-600">Besetzungen</p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow">
              <p className="text-2xl font-bold text-blue-600">{detailData.stats.total_schichten}</p>
              <p className="text-sm text-gray-600">Schichten</p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow">
              <p className="text-2xl font-bold text-amber-600">{detailData.stats.total_proben}</p>
              <p className="text-sm text-gray-600">Proben</p>
            </div>
            <div className="rounded-lg bg-white p-4 shadow">
              <p className="text-2xl font-bold text-green-600">{detailData.stats.total_veranstaltungen}</p>
              <p className="text-sm text-gray-600">Veranstaltungen</p>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Form */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Profil</h2>
            <MitgliedForm person={person} mode="edit" />
          </div>

          {/* Assignments */}
          {detailData && (
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Einsätze & Rollen</h2>
              <PersonAssignments assignments={detailData.assignments} />
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
