import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { getUserProfile } from '@/lib/supabase/server'
import { hasPermission } from '@/lib/supabase/permissions'
import { getKoordinationData } from '@/lib/actions/koordination'
import { KoordinationView } from '@/components/koordination'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const data = await getKoordinationData(id)
  return {
    title: data ? `Helfer-Koordination - ${data.veranstaltung.titel}` : 'Helfer-Koordination',
    description: 'Verwalte und koordiniere die Helfer fuer diese Auffuehrung',
  }
}

export default async function HelferKoordinationPage({ params }: PageProps) {
  const profile = await getUserProfile()

  if (!profile) {
    redirect('/login')
  }

  // Check permission
  if (!hasPermission(profile.role, 'veranstaltungen:write')) {
    redirect('/dashboard')
  }

  const { id } = await params
  const data = await getKoordinationData(id)

  if (!data) {
    notFound()
  }

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
      <div className="mx-auto max-w-7xl px-4 py-8">
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
            <span className="text-neutral-900">Helfer-Koordination</span>
          </nav>
        </div>

        {/* Header */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Helfer-Koordination</h1>
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

          {/* Links */}
          <div className="flex gap-2">
            <Link
              href={`/auffuehrungen/${id}/helferliste` as never}
              className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Helferliste anzeigen
            </Link>
            <Link
              href={`/auffuehrungen/${id}/schichten` as never}
              className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Schichten bearbeiten
            </Link>
          </div>
        </div>

        {/* Main Content */}
        <KoordinationView data={data} />

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
