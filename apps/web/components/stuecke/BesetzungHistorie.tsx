'use client'

import type {
  BesetzungHistorie,
  BesetzungHistorieAktion,
} from '@/lib/supabase/types'
import { BesetzungTypBadge } from './BesetzungTypBadge'

interface BesetzungHistorieProps {
  historie: (BesetzungHistorie & {
    person: { vorname: string; nachname: string }
  })[]
}

const aktionConfig: Record<
  BesetzungHistorieAktion,
  { label: string; className: string }
> = {
  erstellt: {
    label: 'Besetzt',
    className: 'text-success-600',
  },
  geaendert: {
    label: 'Geändert',
    className: 'text-blue-600',
  },
  entfernt: {
    label: 'Entfernt',
    className: 'text-error-600',
  },
}

export function BesetzungHistorieList({ historie }: BesetzungHistorieProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (historie.length === 0) {
    return (
      <div className="py-4 text-center text-gray-500">
        Keine Änderungen vorhanden
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {historie.map((eintrag) => {
        const config = aktionConfig[eintrag.aktion]
        return (
          <div
            key={eintrag.id}
            className="flex items-start gap-3 rounded-lg bg-gray-50 px-3 py-2"
          >
            <div className={`text-sm font-medium ${config.className}`}>
              {config.label}
            </div>
            <div className="flex-1">
              <div className="text-sm text-gray-900">
                {eintrag.person.vorname} {eintrag.person.nachname}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <BesetzungTypBadge typ={eintrag.typ} />
                <span className="text-xs text-gray-500">
                  {formatDate(eintrag.geaendert_am)}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
