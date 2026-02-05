import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { getUserProfile } from '@/lib/supabase/server'
import { hasPermission } from '@/lib/supabase/auth-helpers'
import { getHelferlisteData } from '@/lib/actions/helfer-anmeldung'
import { getSchichtSichtbarkeitStats } from '@/lib/actions/schicht-sichtbarkeit'
import { HelferlisteView } from '@/components/auffuehrungen/helferliste'
import {
  HelferStatusControl,
  BulkSichtbarkeitAction,
} from '@/components/admin/helferliste'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const data = await getHelferlisteData(id)
  return {
    title: data ? `Helferliste - ${data.veranstaltung.titel}` : 'Helferliste',
    description: 'Melde dich fuer Schichten an',
  }
}

export default async function HelferlistePage({ params }: PageProps) {
  const profile = await getUserProfile()

  if (!profile) {
    redirect('/login')
  }

  const { id } = await params

  // Fetch data in parallel
  const [data, sichtbarkeitStats] = await Promise.all([
    getHelferlisteData(id),
    getSchichtSichtbarkeitStats(id),
  ])

  if (!data) {
    notFound()
  }

  // Check user permissions
  const canRegister = hasPermission(profile.role, 'helferliste:register')
  const canEdit = hasPermission(profile.role, 'helferliste:write')
  const isAdmin = profile.role === 'ADMIN'

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-CH', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return ''
    return timeStr.slice(0, 5)
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="flex items-center gap-2 text-sm text-neutral-500">
            <Link href="/auffuehrungen" className="hover:text-neutral-700">
              Auffuehrungen
            </Link>
            <span>/</span>
            <Link href={`/auffuehrungen/${id}` as never} className="hover:text-neutral-700">
              {data.veranstaltung.titel}
            </Link>
            <span>/</span>
            <span className="text-neutral-900">Helferliste</span>
          </nav>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Helferliste</h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-gray-600">
            <span className="font-medium">{data.veranstaltung.titel}</span>
            <span>{formatDate(data.veranstaltung.datum)}</span>
            {data.veranstaltung.startzeit && (
              <span>
                {formatTime(data.veranstaltung.startzeit)}
                {data.veranstaltung.endzeit &&
                  ` - ${formatTime(data.veranstaltung.endzeit)}`}{' '}
                Uhr
              </span>
            )}
            {data.veranstaltung.ort && <span>{data.veranstaltung.ort}</span>}
          </div>
        </div>

        {/* Admin Controls */}
        {canEdit && (
          <div className="mb-8 space-y-4">
            <HelferStatusControl
              veranstaltungId={id}
              currentStatus={data.veranstaltung.helfer_status}
              publicToken={data.veranstaltung.public_helfer_token}
              canEdit={canEdit}
              isAdmin={isAdmin}
            />

            <BulkSichtbarkeitAction
              veranstaltungId={id}
              stats={sichtbarkeitStats}
              disabled={data.veranstaltung.helfer_status === 'abgeschlossen'}
            />
          </div>
        )}

        {/* Helferliste View */}
        <HelferlisteView data={data} canRegister={canRegister} canEdit={canEdit} />

        {/* Back Link */}
        <div className="mt-8">
          <Link
            href={`/auffuehrungen/${id}` as never}
            className="text-blue-600 hover:text-blue-800"
          >
            &larr; Zurueck zur Auffuehrung
          </Link>
        </div>
      </div>
    </main>
  )
}
