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
}

export default async function HelferPage() {
  const profile = await getUserProfile()
  const supabase = await createClient()

  // Try to find the person linked to this user
  const { data: person } = await supabase
    .from('personen')
    .select('id, vorname, nachname')
    .eq('email', profile?.email ?? '')
    .single()

  // Get upcoming helper shifts for this person
  const { data: schichten } = person
    ? await supabase
        .from('helferschichten')
        .select(`
          id,
          status,
          helfereinsatz:helfereinsaetze (
            id,
            titel,
            datum,
            startzeit,
            endzeit
          )
        `)
        .eq('person_id', person.id)
        .gte('helfereinsatz.datum', new Date().toISOString().split('T')[0])
        .order('helfereinsatz(datum)', { ascending: true })
        .limit(5)
    : { data: [] }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Helfer-Portal
          </h1>
          <p className="text-gray-600 mt-1">
            {person
              ? `Willkommen zurück, ${person.vorname}!`
              : 'Dein Bereich für Helfereinsätze'}
          </p>
        </div>

        {!person && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800">
              Dein Account ist noch nicht mit einem Profil verknüpft.
              Bitte wende dich an einen Administrator.
            </p>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="text-3xl font-bold text-gray-900">
              {schichten?.length ?? 0}
            </div>
            <div className="text-sm text-gray-600">Anstehende Einsätze</div>
          </div>
        </div>

        {/* Upcoming Shifts */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Meine nächsten Einsätze
          </h2>
          {schichten && schichten.length > 0 ? (
            <div className="space-y-3">
              {schichten.map((schicht) => {
                const einsatz = schicht.helfereinsatz as unknown as HelfereinsatzData | null
                return (
                  <div
                    key={schicht.id}
                    className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                  >
                    <div>
                      <div className="font-medium text-gray-900">
                        {einsatz?.titel ?? 'Einsatz'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {einsatz?.datum ?? ''}
                        {einsatz?.startzeit && ` um ${einsatz.startzeit}`}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        schicht.status === 'bestaetigt'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {schicht.status === 'bestaetigt' ? 'Bestätigt' : 'Angefragt'}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-500">
              Keine anstehenden Einsätze. Schau bei den verfügbaren Einsätzen
              vorbei!
            </p>
          )}
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href={'/helfer/schichten' as never}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:border-gray-300 transition-colors"
          >
            <h3 className="font-semibold text-gray-900 mb-2">Meine Schichten</h3>
            <p className="text-gray-600 text-sm">
              Alle deine Einsätze und Schichten im Überblick
            </p>
          </Link>

          <Link
            href={'/helfer/einsaetze' as never}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:border-gray-300 transition-colors"
          >
            <h3 className="font-semibold text-gray-900 mb-2">
              Verfügbare Einsätze
            </h3>
            <p className="text-gray-600 text-sm">
              Melde dich für offene Helfereinsätze an
            </p>
          </Link>

          <Link
            href="/profile"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:border-gray-300 transition-colors"
          >
            <h3 className="font-semibold text-gray-900 mb-2">Mein Profil</h3>
            <p className="text-gray-600 text-sm">
              Kontaktdaten und Einstellungen verwalten
            </p>
          </Link>
        </div>
      </div>
    </main>
  )
}
