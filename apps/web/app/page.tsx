import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()

  // Get upcoming performances with open helper spots
  const today = new Date().toISOString().split('T')[0]

  const { data: auffuehrungen } = await supabase
    .from('veranstaltungen')
    .select('id, titel, datum, startzeit')
    .eq('typ', 'auffuehrung')
    .in('status', ['geplant', 'bestaetigt'])
    .gte('datum', today)
    .order('datum', { ascending: true })
    .limit(4)

  // Get shift data for these performances
  let auffuehrungenMitBedarf: Array<{
    id: string
    titel: string
    datum: string
    startzeit: string | null
    offeneSchichten: number
    gesamtSchichten: number
  }> = []

  if (auffuehrungen && auffuehrungen.length > 0) {
    const ids = auffuehrungen.map((a) => a.id)

    // Get all shifts for these performances
    const { data: schichten } = await supabase
      .from('auffuehrung_schichten')
      .select('id, veranstaltung_id, anzahl_benoetigt')
      .in('veranstaltung_id', ids)

    // Get assignment counts
    const schichtIds = schichten?.map((s) => s.id) || []
    const zuweisungCounts: Record<string, number> = {}

    if (schichtIds.length > 0) {
      const { data: zuweisungen } = await supabase
        .from('auffuehrung_zuweisungen')
        .select('schicht_id')
        .in('schicht_id', schichtIds)
        .in('status', ['zugesagt', 'erschienen'])

      zuweisungen?.forEach((z) => {
        zuweisungCounts[z.schicht_id] =
          (zuweisungCounts[z.schicht_id] || 0) + 1
      })
    }

    // Calculate open spots per performance
    const bedarfProVeranstaltung: Record<
      string,
      { offen: number; gesamt: number }
    > = {}
    schichten?.forEach((s) => {
      if (!bedarfProVeranstaltung[s.veranstaltung_id]) {
        bedarfProVeranstaltung[s.veranstaltung_id] = { offen: 0, gesamt: 0 }
      }
      const zugewiesen = zuweisungCounts[s.id] || 0
      const offen = Math.max(0, s.anzahl_benoetigt - zugewiesen)
      bedarfProVeranstaltung[s.veranstaltung_id].offen += offen
      bedarfProVeranstaltung[s.veranstaltung_id].gesamt += s.anzahl_benoetigt
    })

    auffuehrungenMitBedarf = auffuehrungen.map((a) => ({
      ...a,
      offeneSchichten: bedarfProVeranstaltung[a.id]?.offen || 0,
      gesamtSchichten: bedarfProVeranstaltung[a.id]?.gesamt || 0,
    }))
  }

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('de-CH', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return ''
    return timeStr.slice(0, 5) + ' Uhr'
  }

  const totalOffeneSchichten = auffuehrungenMitBedarf.reduce(
    (sum, a) => sum + a.offeneSchichten,
    0
  )

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-neutral-50 to-neutral-100 px-4 py-12">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
            BackstagePass
          </h1>
          <p className="mt-2 text-neutral-600">Theatergruppe Widen</p>
        </div>

        {/* Two Column Layout */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Login Card */}
          <div className="flex flex-col rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
            <div className="mb-6">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100">
                <svg
                  className="h-6 w-6 text-primary-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-neutral-900">
                Mitglieder-Bereich
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                Proben, Events und Einsätze verwalten
              </p>
            </div>

            <div className="mt-auto space-y-3">
              <Link
                href="/login"
                className="block w-full rounded-lg bg-primary-600 px-4 py-3 text-center font-medium text-white transition-colors hover:bg-primary-700"
              >
                Anmelden
              </Link>
              <p className="text-center text-sm text-neutral-500">
                Noch kein Konto?{' '}
                <Link
                  href="/signup"
                  className="font-medium text-primary-600 hover:text-primary-700"
                >
                  Registrieren
                </Link>
              </p>
            </div>
          </div>

          {/* Helper Card */}
          <div className="flex flex-col rounded-2xl border border-secondary-200 bg-gradient-to-br from-secondary-50 to-white p-8 shadow-sm">
            <div className="mb-6">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary-100">
                <svg
                  className="h-6 w-6 text-secondary-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-neutral-900">
                Helfer gesucht!
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                Unterstütze uns bei unseren Aufführungen
              </p>
            </div>

            {/* Upcoming performances with open spots */}
            {auffuehrungenMitBedarf.length > 0 ? (
              <div className="mb-6 flex-1">
                <p className="mb-3 text-xs font-medium uppercase tracking-wider text-neutral-500">
                  Nächste Aufführungen
                </p>
                <ul className="space-y-3">
                  {auffuehrungenMitBedarf.map((auffuehrung) => (
                    <li
                      key={auffuehrung.id}
                      className="flex items-center justify-between rounded-lg bg-white/70 px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-neutral-900">
                          {auffuehrung.titel}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {formatDate(auffuehrung.datum)}
                          {auffuehrung.startzeit &&
                            ` · ${formatTime(auffuehrung.startzeit)}`}
                        </p>
                      </div>
                      {auffuehrung.offeneSchichten > 0 ? (
                        <span className="ml-3 flex-shrink-0 rounded-full bg-secondary-100 px-2.5 py-1 text-xs font-semibold text-secondary-700">
                          {auffuehrung.offeneSchichten} offen
                        </span>
                      ) : (
                        <span className="ml-3 flex-shrink-0 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
                          Besetzt
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="mb-6 flex-1 rounded-lg bg-white/50 p-4 text-center text-sm text-neutral-500">
                Aktuell keine Aufführungen geplant.
              </div>
            )}

            {/* Summary and CTA */}
            <div className="mt-auto">
              {totalOffeneSchichten > 0 && (
                <p className="mb-3 text-center text-sm font-medium text-secondary-700">
                  {totalOffeneSchichten} offene{' '}
                  {totalOffeneSchichten === 1 ? 'Schicht' : 'Schichten'} verfügbar
                </p>
              )}
              <Link
                href="/helferliste"
                className="block w-full rounded-lg border-2 border-secondary-300 bg-white px-4 py-3 text-center font-medium text-secondary-700 transition-colors hover:border-secondary-400 hover:bg-secondary-50"
              >
                Zur Helfer-Übersicht
              </Link>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-10 text-center text-sm text-neutral-400">
          <p>&copy; {new Date().getFullYear()} Theatergruppe Widen</p>
        </footer>
      </div>
    </main>
  )
}
