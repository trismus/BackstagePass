import Link from 'next/link'
import type {
  AnmeldungMitVeranstaltung,
  StundenkontoEintrag,
} from '@/lib/supabase/types'

interface UpcomingEventsWidgetProps {
  anmeldungen: AnmeldungMitVeranstaltung[]
}

export function UpcomingEventsWidget({ anmeldungen }: UpcomingEventsWidgetProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-CH', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    })
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-blue-50 border-b">
        <h3 className="font-medium text-blue-900">Meine Veranstaltungen</h3>
      </div>
      {anmeldungen.length > 0 ? (
        <div className="divide-y divide-gray-100">
          {anmeldungen.slice(0, 5).map((a) => (
            <Link
              key={a.id}
              href={`/veranstaltungen/${a.veranstaltung.id}`}
              className="block p-3 hover:bg-gray-50"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    {a.veranstaltung.titel}
                  </p>
                  <p className="text-xs text-gray-500">
                    {a.veranstaltung.ort || 'Kein Ort'}
                  </p>
                </div>
                <span className="text-xs text-gray-500">
                  {formatDate(a.veranstaltung.datum)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="p-4 text-center text-gray-500 text-sm">
          Keine anstehenden Veranstaltungen
        </div>
      )}
      <div className="px-4 py-2 bg-gray-50 border-t">
        <Link
          href="/veranstaltungen"
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          Alle Veranstaltungen &rarr;
        </Link>
      </div>
    </div>
  )
}

interface StundenWidgetProps {
  total: number
  thisYear: number
  lastEntries: StundenkontoEintrag[]
}

export function StundenWidget({ total, thisYear, lastEntries }: StundenWidgetProps) {
  const currentYear = new Date().getFullYear()

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-green-50 border-b">
        <h3 className="font-medium text-green-900">Mein Stundenkonto</h3>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{total.toFixed(1)}</p>
            <p className="text-xs text-gray-500">Stunden gesamt</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{thisYear.toFixed(1)}</p>
            <p className="text-xs text-gray-500">{currentYear}</p>
          </div>
        </div>

        {lastEntries.length > 0 && (
          <div className="border-t pt-3">
            <p className="text-xs text-gray-500 mb-2">Letzte Einträge:</p>
            {lastEntries.slice(0, 3).map((e) => (
              <div key={e.id} className="flex justify-between text-sm py-1">
                <span className="text-gray-600 truncate flex-1">
                  {e.beschreibung || e.typ}
                </span>
                <span
                  className={`font-medium ml-2 ${
                    e.stunden >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {e.stunden >= 0 ? '+' : ''}
                  {e.stunden.toFixed(1)}h
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="px-4 py-2 bg-gray-50 border-t">
        <Link
          href="/mein-bereich/stundenkonto"
          className="text-green-600 hover:text-green-800 text-sm"
        >
          Details anzeigen &rarr;
        </Link>
      </div>
    </div>
  )
}

export function QuickLinksWidget() {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b">
        <h3 className="font-medium text-gray-900">Schnellzugriff</h3>
      </div>
      <div className="grid grid-cols-2 gap-2 p-3">
        <Link
          href="/veranstaltungen"
          className="flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <span className="text-xl">📅</span>
          <span className="text-sm font-medium text-gray-700">Veranstaltungen</span>
        </Link>
        <Link
          href="/helfereinsaetze"
          className="flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <span className="text-xl">🤝</span>
          <span className="text-sm font-medium text-gray-700">Helfereinsätze</span>
        </Link>
        <Link
          href="/mitglieder"
          className="flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <span className="text-xl">👥</span>
          <span className="text-sm font-medium text-gray-700">Mitglieder</span>
        </Link>
        <Link
          href="/profile"
          className="flex items-center gap-2 p-3 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <span className="text-xl">⚙️</span>
          <span className="text-sm font-medium text-gray-700">Mein Profil</span>
        </Link>
      </div>
    </div>
  )
}
