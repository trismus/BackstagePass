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
        .select(
          `
          id,
          status,
          helfereinsatz:helfereinsaetze (
            id,
            titel,
            datum,
            startzeit,
            endzeit
          )
        `
        )
        .eq('person_id', person.id)
        .gte('helfereinsatz.datum', new Date().toISOString().split('T')[0])
        .order('helfereinsatz(datum)', { ascending: true })
        .limit(5)
    : { data: [] }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Helfer-Portal</h1>
        <p className="mt-1 text-neutral-600">
          {person
            ? `Willkommen zurück, ${person.vorname}!`
            : 'Dein Bereich für Helfereinsätze'}
        </p>
      </div>

      {!person && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
          <p className="text-yellow-800">
            Dein Account ist noch nicht mit einem Profil verknüpft. Bitte
            wende dich an einen Administrator.
          </p>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <div className="text-3xl font-bold text-neutral-900">
            {schichten?.length ?? 0}
          </div>
          <div className="text-sm text-neutral-600">Anstehende Einsätze</div>
        </div>
      </div>

      {/* Upcoming Shifts */}
      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900">
          Meine nächsten Einsätze
        </h2>
        {schichten && schichten.length > 0 ? (
          <div className="space-y-3">
            {schichten.map((schicht) => {
              const einsatz =
                schicht.helfereinsatz as unknown as HelfereinsatzData | null
              return (
                <div
                  key={schicht.id}
                  className="flex items-center justify-between border-b border-neutral-100 pb-3 last:border-0 last:pb-0"
                >
                  <div>
                    <div className="font-medium text-neutral-900">
                      {einsatz?.titel ?? 'Einsatz'}
                    </div>
                    <div className="text-sm text-neutral-600">
                      {einsatz?.datum ?? ''}
                      {einsatz?.startzeit && ` um ${einsatz.startzeit}`}
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
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
              )
            })}
          </div>
        ) : (
          <p className="text-neutral-500">
            Keine anstehenden Einsätze. Schau bei den verfügbaren Einsätzen
            vorbei!
          </p>
        )}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href={'/helfer/schichten' as never}
          className="rounded-xl border border-neutral-200 bg-white p-6 transition-colors hover:border-neutral-300"
        >
          <h3 className="mb-2 font-semibold text-neutral-900">
            Meine Schichten
          </h3>
          <p className="text-sm text-neutral-600">
            Alle deine Einsätze und Schichten im Überblick
          </p>
        </Link>

        <Link
          href={'/helfer/einsaetze' as never}
          className="rounded-xl border border-neutral-200 bg-white p-6 transition-colors hover:border-neutral-300"
        >
          <h3 className="mb-2 font-semibold text-neutral-900">
            Verfügbare Einsätze
          </h3>
          <p className="text-sm text-neutral-600">
            Melde dich für offene Helfereinsätze an
          </p>
        </Link>

        <Link
          href="/profile"
          className="rounded-xl border border-neutral-200 bg-white p-6 transition-colors hover:border-neutral-300"
        >
          <h3 className="mb-2 font-semibold text-neutral-900">Mein Profil</h3>
          <p className="text-sm text-neutral-600">
            Kontaktdaten und Einstellungen verwalten
          </p>
        </Link>
      </div>
    </div>
  )
}
