import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getHelferEventMitRollen } from '@/lib/actions/helferliste'
import { getHelferRollenTemplates } from '@/lib/actions/helfer-templates'
import { getUserProfile } from '@/lib/supabase/server'
import { isManagement } from '@/lib/supabase/auth-helpers'
import { HelferEventHeader } from '@/components/helferliste/HelferEventHeader'
import { RollenInstanzEditor } from '@/components/helferliste/RollenInstanzEditor'
import { AnmeldungenListe } from '@/components/helferliste/AnmeldungenListe'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const event = await getHelferEventMitRollen(id)
  return {
    title: event?.name || 'Helfer-Event',
  }
}

export default async function HelferEventDetailPage({ params }: PageProps) {
  const { id } = await params
  const event = await getHelferEventMitRollen(id)
  const profile = await getUserProfile()
  const canManage = profile ? isManagement(profile.role) : false
  const templates = canManage ? await getHelferRollenTemplates() : []

  if (!event) {
    notFound()
  }

  // Count totals
  const totalBenoetigt = event.rollen.reduce(
    (sum, r) => sum + r.anzahl_benoetigt,
    0
  )
  const totalAngemeldet = event.rollen.reduce(
    (sum, r) => sum + r.angemeldet_count,
    0
  )

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Back Link */}
        <Link
          href={'/helferliste' as never}
          className="text-sm text-primary-600 hover:text-primary-800"
        >
          &larr; Zurück zur Helferliste
        </Link>

        {/* Event Header */}
        <HelferEventHeader
          event={event}
          canManage={canManage}
          totalBenoetigt={totalBenoetigt}
          totalAngemeldet={totalAngemeldet}
        />

        {/* Roles and Registrations */}
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Rollen */}
          <div className="lg:col-span-2">
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Rollen ({event.rollen.length})
                </h2>
              </div>

              {canManage && (
                <RollenInstanzEditor
                  eventId={event.id}
                  templates={templates}
                  eventStart={event.datum_start}
                  eventEnd={event.datum_end}
                />
              )}

              {/* Rollen List */}
              {event.rollen.length === 0 ? (
                <p className="py-8 text-center text-gray-500">
                  Noch keine Rollen definiert.
                  {canManage && ' Fügen Sie oben Rollen hinzu.'}
                </p>
              ) : (
                <div className="mt-6 space-y-4">
                  {event.rollen.map((rolle) => (
                    <RolleCard
                      key={rolle.id}
                      rolle={rolle}
                      canManage={canManage}
                      currentUserId={profile?.id}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Public Link */}
            {canManage && (
              <div className="rounded-lg bg-white p-6 shadow">
                <h3 className="mb-3 text-sm font-medium text-gray-900">
                  Öffentlicher Link
                </h3>
                <p className="mb-3 text-xs text-gray-500">
                  Teilen Sie diesen Link mit externen Helfern. Sie können sich
                  ohne Login für öffentliche Rollen anmelden.
                </p>
                <div className="break-all rounded bg-gray-50 p-2 font-mono text-xs">
                  {typeof window !== 'undefined'
                    ? `${window.location.origin}/helfer/${event.public_token}`
                    : `/helfer/${event.public_token}`}
                </div>
                <CopyLinkButton token={event.public_token} />
              </div>
            )}

            {/* Quick Stats */}
            <div className="rounded-lg bg-white p-6 shadow">
              <h3 className="mb-4 text-sm font-medium text-gray-900">
                Übersicht
              </h3>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Benötigte Helfer</dt>
                  <dd className="text-sm font-medium">{totalBenoetigt}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Angemeldet</dt>
                  <dd className="text-sm font-medium">{totalAngemeldet}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-gray-500">Noch offen</dt>
                  <dd
                    className={`text-sm font-medium ${totalBenoetigt - totalAngemeldet > 0 ? 'text-warning-600' : 'text-success-600'}`}
                  >
                    {Math.max(0, totalBenoetigt - totalAngemeldet)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

// Rolle Card Component
import { RollenInstanzMitAnmeldungen } from '@/lib/supabase/types'
import { AnmeldungForm } from '@/components/helferliste/AnmeldungForm'
import { CopyLinkButton } from '@/components/helferliste/CopyLinkButton'
import { RolleActions } from '@/components/helferliste/RolleActions'

function RolleCard({
  rolle,
  canManage,
  currentUserId,
}: {
  rolle: RollenInstanzMitAnmeldungen
  canManage: boolean
  currentUserId?: string
}) {
  const rollenName =
    rolle.template?.name || rolle.custom_name || 'Unbekannte Rolle'
  const isFull = rolle.angemeldet_count >= rolle.anzahl_benoetigt
  const isUserRegistered = rolle.anmeldungen.some(
    (a) => a.profile_id === currentUserId && a.status !== 'abgelehnt'
  )

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="rounded-lg border border-gray-200 p-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium text-gray-900">{rollenName}</h3>
          {(rolle.zeitblock_start || rolle.zeitblock_end) && (
            <p className="mt-1 text-sm text-gray-500">
              {formatDateTime(rolle.zeitblock_start)}
              {rolle.zeitblock_end &&
                ` - ${formatDateTime(rolle.zeitblock_end)}`}
            </p>
          )}
          <div className="mt-2 flex items-center gap-2">
            <span
              className={`text-sm ${isFull ? 'text-success-600' : 'text-gray-600'}`}
            >
              {rolle.angemeldet_count} / {rolle.anzahl_benoetigt} Helfer
            </span>
            {rolle.sichtbarkeit === 'public' && (
              <span className="rounded bg-info-100 px-2 py-0.5 text-xs text-info-700">
                Öffentlich
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canManage && <RolleActions rolleId={rolle.id} />}
        </div>
      </div>

      {/* Anmeldungen */}
      {rolle.anmeldungen.length > 0 && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <AnmeldungenListe
            anmeldungen={rolle.anmeldungen}
            canManage={canManage}
          />
        </div>
      )}

      {/* Registration Button */}
      {!isUserRegistered && !isFull && currentUserId && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <AnmeldungForm rollenInstanzId={rolle.id} />
        </div>
      )}

      {isUserRegistered && (
        <p className="mt-4 text-sm text-success-600">
          Du bist für diese Rolle angemeldet
        </p>
      )}
    </div>
  )
}
