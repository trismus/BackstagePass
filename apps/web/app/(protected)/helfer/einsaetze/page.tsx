import Link from 'next/link'
import { getUserProfile } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

export default async function VerfuegbareEinsaetzePage() {
  const profile = await getUserProfile()
  const supabase = await createClient()

  // Try to find the person linked to this user
  const { data: person } = await supabase
    .from('personen')
    .select('id')
    .eq('email', profile?.email ?? '')
    .single()

  // Get upcoming helper events that still need helpers
  const today = new Date().toISOString().split('T')[0]
  const { data: einsaetze } = await supabase
    .from('helfereinsaetze')
    .select(
      `
      id,
      titel,
      datum,
      startzeit,
      endzeit,
      ort,
      beschreibung,
      helfer_max,
      helferschichten (id)
    `
    )
    .gte('datum', today)
    .order('datum', { ascending: true })
    .limit(20)

  // Get user's existing registrations
  const { data: meineSchichten } = person
    ? await supabase
        .from('helferschichten')
        .select('helfereinsatz_id')
        .eq('person_id', person.id)
    : { data: [] }

  const meineEinsatzIds = new Set(
    meineSchichten?.map((s) => s.helfereinsatz_id) ?? []
  )

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={'/helfer' as never}
            className="mb-2 inline-block text-sm text-gray-500 hover:text-gray-700"
          >
            &larr; Zurück zur Übersicht
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            Verfügbare Einsätze
          </h1>
          <p className="mt-1 text-gray-600">Melde dich für Helfereinsätze an</p>
        </div>

        {!person && (
          <div className="mb-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <p className="text-yellow-800">
              Du musst mit einem Profil verknüpft sein, um dich für Einsätze
              anzumelden.
            </p>
          </div>
        )}

        {/* Available Events */}
        <div className="space-y-4">
          {einsaetze && einsaetze.length > 0 ? (
            einsaetze.map((einsatz) => {
              const registered = meineEinsatzIds.has(einsatz.id)
              const schichtenArray = einsatz.helferschichten as unknown as
                | { id: string }[]
                | null
              const currentHelpers = schichtenArray?.length ?? 0
              const spotsLeft = einsatz.helfer_max
                ? einsatz.helfer_max - currentHelpers
                : null
              const isFull = spotsLeft !== null && spotsLeft <= 0

              return (
                <div
                  key={einsatz.id}
                  className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {einsatz.titel}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {einsatz.datum}
                        {einsatz.startzeit && ` | ${einsatz.startzeit}`}
                        {einsatz.endzeit && ` - ${einsatz.endzeit}`}
                      </p>
                      {einsatz.ort && (
                        <p className="text-sm text-gray-500">{einsatz.ort}</p>
                      )}
                      {einsatz.beschreibung && (
                        <p className="mt-2 text-sm text-gray-600">
                          {einsatz.beschreibung}
                        </p>
                      )}
                      {spotsLeft !== null && (
                        <p
                          className={`mt-2 text-sm ${
                            isFull ? 'text-red-600' : 'text-green-600'
                          }`}
                        >
                          {isFull
                            ? 'Ausgebucht'
                            : `${spotsLeft} Plätze verfügbar`}
                        </p>
                      )}
                    </div>
                    <div className="ml-4">
                      {registered ? (
                        <span className="rounded bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                          Angemeldet
                        </span>
                      ) : isFull ? (
                        <span className="rounded bg-gray-100 px-3 py-1 text-sm font-medium text-gray-500">
                          Voll
                        </span>
                      ) : (
                        <button
                          disabled={!person}
                          className="rounded bg-black px-3 py-1 text-sm font-medium text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
                        >
                          Anmelden
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
              <p className="text-gray-500">
                Momentan gibt es keine offenen Helfereinsätze.
              </p>
              <p className="mt-1 text-sm text-gray-400">
                Schau später wieder vorbei!
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
