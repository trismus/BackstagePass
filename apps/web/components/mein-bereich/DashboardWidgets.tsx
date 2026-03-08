import Link from 'next/link'
import type {
  AnmeldungMitVeranstaltung,
  MeineProbe,
} from '@/lib/supabase/types'
import type { MeineProduktionsAuffuehrung } from '@/lib/actions/produktionen'
import type { DashboardSchicht } from '@/lib/actions/auffuehrung-schichten'

type MergedEvent = {
  key: string
  titel: string
  ort: string | null
  datum: string
  href: string
}

interface UpcomingEventsWidgetProps {
  anmeldungen: AnmeldungMitVeranstaltung[]
  produktionsAuffuehrungen?: MeineProduktionsAuffuehrung[]
}

export function UpcomingEventsWidget({
  anmeldungen,
  produktionsAuffuehrungen = [],
}: UpcomingEventsWidgetProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-CH', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    })
  }

  // Build merged list: anmeldungen + produktions-aufführungen (deduplicated)
  const merged: MergedEvent[] = []
  const seenVeranstaltungIds = new Set<string>()

  for (const a of anmeldungen) {
    seenVeranstaltungIds.add(a.veranstaltung.id)
    merged.push({
      key: `a-${a.id}`,
      titel: a.veranstaltung.titel,
      ort: a.veranstaltung.ort ?? null,
      datum: a.veranstaltung.datum,
      href: `/veranstaltungen/${a.veranstaltung.id}`,
    })
  }

  for (const pa of produktionsAuffuehrungen) {
    if (seenVeranstaltungIds.has(pa.veranstaltung_id)) continue
    merged.push({
      key: `pa-${pa.id}`,
      titel: pa.titel,
      ort: pa.ort,
      datum: pa.datum,
      href: `/auffuehrungen/${pa.veranstaltung_id}`,
    })
  }

  merged.sort((a, b) => a.datum.localeCompare(b.datum))
  const display = merged.slice(0, 5)

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="border-b border-blue-100 bg-blue-50 px-4 py-3">
        <h3 className="font-medium text-blue-900">Meine Veranstaltungen</h3>
      </div>
      {display.length > 0 ? (
        <div className="divide-y divide-neutral-100">
          {display.map((event) => (
            <Link
              key={event.key}
              href={event.href as never}
              className="block p-3 transition-colors hover:bg-neutral-50"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    {event.titel}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {event.ort || 'Kein Ort'}
                  </p>
                </div>
                <span className="text-xs text-neutral-500">
                  {formatDate(event.datum)}
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

interface MeineProbenWidgetProps {
  proben: MeineProbe[]
}

export function MeineProbenWidget({ proben }: MeineProbenWidgetProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-CH', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    })
  }

  const formatTime = (start: string | null, end: string | null) => {
    if (!start) return null
    const s = start.slice(0, 5)
    const e = end ? end.slice(0, 5) : null
    return e ? `${s}–${e}` : s
  }

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="border-b border-purple-100 bg-purple-50 px-4 py-3">
        <h3 className="font-medium text-purple-900">Meine Proben</h3>
      </div>
      {proben.length > 0 ? (
        <div className="divide-y divide-neutral-100">
          {proben.map((p) => (
            <Link
              key={p.id}
              href={`/proben/${p.probe_id}` as never}
              className="block p-3 transition-colors hover:bg-neutral-50"
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-900">
                    {p.stueck_titel ? `${p.stueck_titel}: ` : ''}{p.titel}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {p.ort || 'Kein Ort'}
                    {formatTime(p.startzeit, p.endzeit) && ` • ${formatTime(p.startzeit, p.endzeit)}`}
                  </p>
                </div>
                <div className="ml-2 flex flex-col items-end gap-1">
                  <span className="text-xs text-neutral-500">
                    {formatDate(p.datum)}
                  </span>
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.status === 'zugesagt'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {p.status === 'zugesagt' ? 'Zugesagt' : 'Eingeladen'}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="p-4 text-center text-sm text-neutral-500">
          Keine anstehenden Proben
        </div>
      )}
      <div className="border-t border-neutral-100 bg-neutral-50 px-4 py-2">
        <Link
          href="/proben"
          className="text-sm text-purple-600 hover:text-purple-800"
        >
          Alle Proben &rarr;
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
    { href: '/helferliste', icon: '🤝', label: 'Helferliste' },
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

interface OffeneSchichtenWidgetProps {
  schichten: DashboardSchicht[]
  maxEvents?: number
}

export function OffeneSchichtenWidget({
  schichten,
  maxEvents,
}: OffeneSchichtenWidgetProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-CH', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    })
  }

  const formatTime = (start: string, end: string) => {
    return `${start.slice(0, 5)}–${end.slice(0, 5)}`
  }

  // Sort shifts by date, then by time
  const sorted = [...schichten].sort((a, b) => {
    const dateCmp = a.veranstaltung.datum.localeCompare(b.veranstaltung.datum)
    if (dateCmp !== 0) return dateCmp
    const aStart = a.zeitblock?.startzeit ?? ''
    const bStart = b.zeitblock?.startzeit ?? ''
    return aStart.localeCompare(bStart)
  })

  // Group shifts by veranstaltung
  const grouped = new Map<string, { veranstaltung: DashboardSchicht['veranstaltung']; schichten: DashboardSchicht[] }>()
  for (const s of sorted) {
    const key = s.veranstaltung.id
    if (!grouped.has(key)) {
      grouped.set(key, { veranstaltung: s.veranstaltung, schichten: [] })
    }
    grouped.get(key)!.schichten.push(s)
  }

  // Limit to maxEvents veranstaltungen if specified
  const allGroups = [...grouped.values()]
  const displayGroups = maxEvents ? allGroups.slice(0, maxEvents) : allGroups
  const hasMore = maxEvents ? allGroups.length > maxEvents : false

  // Total free slots across all shifts
  const totalFreiePlaetze = schichten.reduce((sum, s) => sum + s.freie_plaetze, 0)

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="border-b border-orange-100 bg-orange-50 px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-orange-900">Offene Schichten</h3>
            <p className="mt-0.5 text-sm text-orange-700">
              Melde dich für verfügbare Schichten an
            </p>
          </div>
          {schichten.length > 0 && (
            <div className="text-right">
              <span className="text-2xl font-bold text-orange-600">{totalFreiePlaetze}</span>
              <p className="text-xs text-orange-700">freie Plätze</p>
            </div>
          )}
        </div>
      </div>
      {displayGroups.length > 0 ? (
        <div className="divide-y divide-neutral-100">
          {displayGroups.map(({ veranstaltung, schichten: items }) => (
            <div key={veranstaltung.id} className="px-5 py-4">
              <div className="mb-3 flex items-center justify-between">
                <Link
                  href={`/auffuehrungen/${veranstaltung.id}/helferliste` as never}
                  className="font-semibold text-neutral-900 hover:text-orange-700"
                >
                  {veranstaltung.titel}
                </Link>
                <span className="ml-3 shrink-0 text-sm text-neutral-500">
                  {formatDate(veranstaltung.datum)}
                  {veranstaltung.ort && ` • ${veranstaltung.ort}`}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((s) => (
                  <Link
                    key={s.id}
                    href={`/auffuehrungen/${veranstaltung.id}/helferliste` as never}
                    className="rounded-lg border border-neutral-200 p-3 transition-colors hover:border-orange-300 hover:bg-orange-50"
                  >
                    <p className="text-sm font-medium text-neutral-900">
                      {s.rolle}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between text-xs text-neutral-500">
                      <span>
                        {s.zeitblock ? formatTime(s.zeitblock.startzeit, s.zeitblock.endzeit) : 'Ganzer Tag'}
                      </span>
                      <span className="rounded-full bg-green-50 px-2 py-0.5 font-medium text-green-700">
                        {s.freie_plaetze} frei
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-6 text-center text-sm text-neutral-500">
          Keine offenen Schichten verfügbar
        </div>
      )}
      <div className="border-t border-neutral-100 bg-neutral-50 px-5 py-3">
        <Link
          href={"/mitmachen" as never}
          className="text-sm font-medium text-orange-600 hover:text-orange-800"
        >
          {hasMore ? 'Alle Schichten ansehen' : 'Zur Mitmachen-Seite'} &rarr;
        </Link>
      </div>
    </div>
  )
}

