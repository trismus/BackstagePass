import Link from 'next/link'
import { getUserProfile } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'

// Define type for the joined data
type HelfereinsatzData = {
  id: string
  titel: string
  datum: string
  startzeit?: string | null
  endzeit?: string | null
  ort?: string | null
}

export default async function MeineSchichtenPage() {
  const profile = await getUserProfile()
  const supabase = await createClient()

  // Try to find the person linked to this user
  const { data: person } = await supabase
    .from('personen')
    .select('id, vorname, nachname')
    .eq('email', profile?.email ?? '')
    .single()

  // Get all shifts for this person
  const { data: schichten } = person
    ? await supabase
        .from('helferschichten')
        .select(`
          id,
          status,
          notiz,
          helfereinsatz:helfereinsaetze (
            id,
            titel,
            datum,
            startzeit,
            endzeit,
            ort
          )
        `)
        .eq('person_id', person.id)
        .order('helfereinsatz(datum)', { ascending: false })
    : { data: [] }

  // Split into upcoming and past
  const today = new Date().toISOString().split('T')[0]
  const upcoming = schichten?.filter((s) => {
    const einsatz = s.helfereinsatz as unknown as HelfereinsatzData | null
    return einsatz && einsatz.datum >= today
  }) ?? []
  const past = schichten?.filter((s) => {
    const einsatz = s.helfereinsatz as unknown as HelfereinsatzData | null
    return einsatz && einsatz.datum < today
  }) ?? []

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={'/helfer' as never}
            className="text-sm text-gray-500 hover:text-gray-700 mb-2 inline-block"
          >
            &larr; Zurück zur Übersicht
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Meine Schichten</h1>
          <p className="text-gray-600 mt-1">
            Alle deine Helfereinsätze im Überblick
          </p>
        </div>

        {!person && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800">
              Dein Account ist noch nicht mit einem Profil verknüpft.
            </p>
          </div>
        )}

        {/* Upcoming Shifts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Anstehende Einsätze ({upcoming.length})
          </h2>
          {upcoming.length > 0 ? (
            <div className="space-y-4">
              {upcoming.map((schicht) => {
                const einsatz = schicht.helfereinsatz as unknown as HelfereinsatzData | null
                return (
                  <div
                    key={schicht.id}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {einsatz?.titel ?? 'Einsatz'}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {einsatz?.datum ?? ''}
                          {einsatz?.startzeit && ` | ${einsatz.startzeit}`}
                          {einsatz?.endzeit && ` - ${einsatz.endzeit}`}
                        </p>
                        {einsatz?.ort && (
                          <p className="text-sm text-gray-500">{einsatz.ort}</p>
                        )}
                        {schicht.notiz && (
                          <p className="text-sm text-gray-500 mt-2 italic">
                            &quot;{schicht.notiz}&quot;
                          </p>
                        )}
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          schicht.status === 'bestaetigt'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {schicht.status === 'bestaetigt'
                          ? 'Bestätigt'
                          : 'Angefragt'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-500">Keine anstehenden Einsätze.</p>
          )}
        </div>

        {/* Past Shifts */}
        {past.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Vergangene Einsätze ({past.length})
            </h2>
            <div className="space-y-3">
              {past.slice(0, 10).map((schicht) => {
                const einsatz = schicht.helfereinsatz as unknown as HelfereinsatzData | null
                return (
                  <div
                    key={schicht.id}
                    className="flex items-center justify-between text-sm border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <span className="text-gray-900">
                        {einsatz?.titel ?? 'Einsatz'}
                      </span>
                      <span className="text-gray-500 ml-2">
                        {einsatz?.datum ?? ''}
                      </span>
                    </div>
                    <span className="text-gray-500">
                      {schicht.status === 'bestaetigt'
                        ? 'Abgeschlossen'
                        : schicht.status}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
