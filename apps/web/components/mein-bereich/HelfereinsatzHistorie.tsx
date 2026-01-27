import Link from 'next/link'
import type { HelfereinsatzHistorieEintrag } from '@/lib/actions/historie'

interface HelfereinsatzHistorieProps {
  historie: HelfereinsatzHistorieEintrag[]
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  zugesagt: { label: 'Zugesagt', color: 'bg-blue-100 text-blue-700' },
  erschienen: { label: 'Erschienen', color: 'bg-green-100 text-green-700' },
  nicht_erschienen: { label: 'Nicht erschienen', color: 'bg-red-100 text-red-700' },
  abgesagt: { label: 'Abgesagt', color: 'bg-neutral-100 text-neutral-600' },
}

export function HelfereinsatzHistorie({ historie }: HelfereinsatzHistorieProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-CH', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  if (historie.length === 0) {
    return (
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="border-b border-amber-100 bg-amber-50 px-4 py-3">
          <h3 className="font-medium text-amber-900">Vergangene Helfereinsätze</h3>
        </div>
        <div className="p-4 text-center text-sm text-neutral-500">
          Noch keine vergangenen Einsätze
        </div>
      </div>
    )
  }

  // Calculate total hours
  const totalHours = historie.reduce((sum, e) => sum + (e.stundenGearbeitet || 0), 0)
  const erschieneneEinsaetze = historie.filter(e => e.status === 'erschienen').length

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="border-b border-amber-100 bg-amber-50 px-4 py-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-amber-900">Vergangene Helfereinsätze</h3>
          <div className="flex gap-4 text-xs">
            <span className="text-amber-700">
              <strong>{erschieneneEinsaetze}</strong> Einsätze
            </span>
            <span className="text-amber-700">
              <strong>{totalHours.toFixed(1)}</strong> Stunden
            </span>
          </div>
        </div>
      </div>
      <div className="divide-y divide-neutral-100">
        {historie.slice(0, 10).map((eintrag) => {
          const statusInfo = STATUS_LABELS[eintrag.status] || {
            label: eintrag.status,
            color: 'bg-neutral-100 text-neutral-600',
          }

          return (
            <Link
              key={eintrag.id}
              href={`/helfereinsaetze/${eintrag.helfereinsatzId}` as never}
              className="block px-4 py-3 transition-colors hover:bg-neutral-50"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {eintrag.titel}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {eintrag.partnerName && <span>{eintrag.partnerName} • </span>}
                    {eintrag.ort || 'Kein Ort'}
                  </p>
                </div>
                <div className="text-right ml-3">
                  <p className="text-xs text-neutral-500">{formatDate(eintrag.datum)}</p>
                  <div className="mt-1 flex items-center justify-end gap-2">
                    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                    {eintrag.stundenGearbeitet !== null && eintrag.status === 'erschienen' && (
                      <span className="text-xs font-medium text-green-600">
                        {eintrag.stundenGearbeitet.toFixed(1)}h
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
      {historie.length > 10 && (
        <div className="border-t border-neutral-100 bg-neutral-50 px-4 py-2 text-center">
          <span className="text-xs text-neutral-500">
            + {historie.length - 10} weitere Einsätze
          </span>
        </div>
      )}
    </div>
  )
}

export type { HelfereinsatzHistorieProps }
