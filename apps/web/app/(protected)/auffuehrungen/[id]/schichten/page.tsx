import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { getUserProfile } from '@/lib/supabase/server'
import { hasPermission } from '@/lib/supabase/auth-helpers'
import { getVeranstaltung } from '@/lib/actions/veranstaltungen'
import { getTemplates } from '@/lib/actions/templates'
import { getSchichtenStatus } from '@/lib/actions/schicht-generator'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui'
import { TemplateSelector } from '@/components/auffuehrungen/TemplateSelector'
import { SchichtenStatusBanner } from '@/components/auffuehrungen/SchichtenStatusBanner'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const veranstaltung = await getVeranstaltung(id)
  return {
    title: veranstaltung ? `Schichten - ${veranstaltung.titel}` : 'Schichten',
    description: 'Schichten aus Template generieren',
  }
}

export default async function SchichtenPage({ params }: PageProps) {
  const profile = await getUserProfile()

  if (!profile) {
    redirect('/login')
  }

  // Check permission
  if (!hasPermission(profile.role, 'veranstaltungen:write')) {
    redirect('/dashboard')
  }

  const { id } = await params
  const veranstaltung = await getVeranstaltung(id)

  if (!veranstaltung || veranstaltung.typ !== 'auffuehrung') {
    notFound()
  }

  // Fetch templates and current status in parallel
  const [templates, schichtenStatus] = await Promise.all([
    getTemplates(),
    getSchichtenStatus(id),
  ])

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
    if (!timeStr) return '-'
    return timeStr.slice(0, 5)
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <nav className="flex items-center gap-2 text-sm text-neutral-500">
            <Link href="/auffuehrungen" className="hover:text-neutral-700">
              Auffuehrungen
            </Link>
            <span>/</span>
            <Link href={`/auffuehrungen/${id}` as never} className="hover:text-neutral-700">
              {veranstaltung.titel}
            </Link>
            <span>/</span>
            <span className="text-neutral-900">Schichten</span>
          </nav>
        </div>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Schichten konfigurieren
          </h1>
          <p className="mt-1 text-gray-600">
            {formatDate(veranstaltung.datum)}
            {veranstaltung.startzeit && (
              <span className="ml-2">
                um {formatTime(veranstaltung.startzeit)} Uhr
              </span>
            )}
            {veranstaltung.ort && (
              <span className="ml-2">- {veranstaltung.ort}</span>
            )}
          </p>
        </div>

        {/* Status Banner */}
        <SchichtenStatusBanner
          status={schichtenStatus}
          veranstaltungId={id}
          isAdmin={isAdmin}
        />

        {/* Template Selection */}
        {!schichtenStatus.hasSchichten ? (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Template auswaehlen</CardTitle>
              <CardDescription>
                Waehlen Sie ein Template, um automatisch Zeitbloecke und Schichten zu erstellen.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!veranstaltung.startzeit ? (
                <div className="rounded-lg bg-warning-50 p-4 text-warning-800">
                  <p className="font-medium">Keine Startzeit gesetzt</p>
                  <p className="mt-1 text-sm">
                    Bitte setzen Sie zuerst eine Startzeit fuer die Veranstaltung, damit die
                    Schicht-Zeiten korrekt berechnet werden koennen.
                  </p>
                  <Link
                    href={`/veranstaltungen/${id}/bearbeiten` as never}
                    className="mt-3 inline-block text-sm font-medium text-warning-700 underline hover:text-warning-900"
                  >
                    Veranstaltung bearbeiten
                  </Link>
                </div>
              ) : templates.length === 0 ? (
                <div className="rounded-lg bg-neutral-100 p-4 text-neutral-700">
                  <p className="font-medium">Keine Templates verfuegbar</p>
                  <p className="mt-1 text-sm">
                    Es sind noch keine Schicht-Templates definiert.
                  </p>
                  {isAdmin && (
                    <Link
                      href={'/admin/schicht-templates/neu' as never}
                      className="mt-3 inline-block text-sm font-medium text-neutral-900 underline hover:text-neutral-700"
                    >
                      Erstes Template erstellen
                    </Link>
                  )}
                </div>
              ) : (
                <TemplateSelector
                  veranstaltungId={id}
                  templates={templates}
                  startzeit={veranstaltung.startzeit}
                />
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Schichten verwalten</CardTitle>
              <CardDescription>
                Die Schichten wurden bereits generiert. Sie koennen diese jetzt koordinieren.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Link
                  href={`/auffuehrungen/${id}` as never}
                  className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
                >
                  Zur Helfer-Koordination
                </Link>
                <Link
                  href={`/auffuehrungen/${id}` as never}
                  className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                >
                  Auffuehrung anzeigen
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

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
