import Link from 'next/link'
import type {
  AnmeldungMitVeranstaltung,
} from '@/lib/supabase/types'

interface UpcomingEventsWidgetProps {
  anmeldungen: AnmeldungMitVeranstaltung[]
}

export function UpcomingEventsWidget({
  anmeldungen,
}: UpcomingEventsWidgetProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-CH', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    })
  }

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="border-b border-blue-100 bg-blue-50 px-4 py-3">
        <h3 className="font-medium text-blue-900">Meine Veranstaltungen</h3>
      </div>
      {anmeldungen.length > 0 ? (
        <div className="divide-y divide-neutral-100">
          {anmeldungen.slice(0, 5).map((a) => (
            <Link
              key={a.id}
              href={`/veranstaltungen/${a.veranstaltung.id}` as never}
              className="block p-3 transition-colors hover:bg-neutral-50"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    {a.veranstaltung.titel}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {a.veranstaltung.ort || 'Kein Ort'}
                  </p>
                </div>
                <span className="text-xs text-neutral-500">
                  {formatDate(a.veranstaltung.datum)}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="p-4 text-center text-sm text-neutral-500">
          Keine anstehenden Veranstaltungen
        </div>
      )}
      <div className="border-t border-neutral-100 bg-neutral-50 px-4 py-2">
        <Link
          href="/veranstaltungen"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Alle Veranstaltungen &rarr;
        </Link>
      </div>
    </div>
  )
}

interface HelferEinsatz {
  id: string
  titel: string
  datum: string
  startzeit?: string | null
  ort?: string | null
  helfer_max?: number | null
  helferschichten?: { id: string }[] | null
}

interface HelferEinsaetzeWidgetProps {
  einsaetze: HelferEinsatz[]
}

export function HelferEinsaetzeWidget({
  einsaetze,
}: HelferEinsaetzeWidgetProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-CH', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    })
  }

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="border-b border-amber-100 bg-amber-50 px-4 py-3">
        <h3 className="font-medium text-amber-900">Offene Helfereinsätze</h3>
      </div>
      {einsaetze.length > 0 ? (
        <div className="divide-y divide-neutral-100">
          {einsaetze.map((e) => {
            const schichtenArray = e.helferschichten as unknown as
              | { id: string }[]
              | null
            const currentHelpers = schichtenArray?.length ?? 0
            const spotsLeft = e.helfer_max
              ? e.helfer_max - currentHelpers
              : null

            return (
              <Link
                key={e.id}
                href={`/helfereinsaetze/${e.id}` as never}
                className="block p-3 transition-colors hover:bg-neutral-50"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-900">
                      {e.titel}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {e.ort || 'Kein Ort'} {e.startzeit && `• ${e.startzeit}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-neutral-500">
                      {formatDate(e.datum)}
                    </span>
                    {spotsLeft !== null && (
                      <p
                        className={`mt-1 text-xs ${
                          spotsLeft > 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {spotsLeft > 0 ? `${spotsLeft} frei` : 'Voll'}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="p-4 text-center text-sm text-neutral-500">
          Keine offenen Einsätze
        </div>
      )}
      <div className="border-t border-neutral-100 bg-neutral-50 px-4 py-2">
        <Link
          href="/helfereinsaetze"
          className="text-sm text-amber-600 hover:text-amber-800"
        >
          Alle Einsätze &rarr;
        </Link>
      </div>
    </div>
  )
}

interface QuickLinksWidgetProps {
  variant?: 'active' | 'passive'
}

export function QuickLinksWidget({
  variant = 'active',
}: QuickLinksWidgetProps) {
  const activeLinks = [
    { href: '/veranstaltungen', icon: '📅', label: 'Veranstaltungen' },
    { href: '/helfereinsaetze', icon: '🤝', label: 'Helfereinsätze' },
    { href: '/profile', icon: '⚙️', label: 'Mein Profil' },
  ]

  const passiveLinks = [
    { href: '/veranstaltungen', icon: '📅', label: 'Veranstaltungen' },
    { href: '/auffuehrungen', icon: '🎭', label: 'Aufführungen' },
    { href: '/stuecke', icon: '📖', label: 'Stücke' },
    { href: '/profile', icon: '⚙️', label: 'Mein Profil' },
  ]

  const links = variant === 'passive' ? passiveLinks : activeLinks

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="border-b border-neutral-100 bg-neutral-50 px-4 py-3">
        <h3 className="font-medium text-neutral-900">Schnellzugriff</h3>
      </div>
      <div className="grid grid-cols-2 gap-2 p-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href as never}
            className="flex items-center gap-2 rounded-lg p-3 transition-colors hover:bg-neutral-50"
          >
            <span className="text-xl">{link.icon}</span>
            <span className="text-sm font-medium text-neutral-700">
              {link.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
