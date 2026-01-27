'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { cancelSchicht } from '@/lib/actions/helferschichten'

interface Schicht {
  id: string
  status: string
  startzeit: string | null
  endzeit: string | null
  helferrolle: { rolle: string } | null
  helfereinsatz: {
    id: string
    titel: string
    datum: string
    startzeit: string | null
    endzeit: string | null
    ort: string | null
    partner: { name: string } | null
  } | null
}

interface MeineSchichtenProps {
  schichten: Schicht[]
  personId?: string
}

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  zugesagt: { label: 'Zugesagt', color: 'bg-green-100 text-green-700' },
  abgesagt: { label: 'Abgesagt', color: 'bg-neutral-100 text-neutral-500' },
  erschienen: { label: 'Erschienen', color: 'bg-blue-100 text-blue-700' },
  nicht_erschienen: { label: 'Nicht erschienen', color: 'bg-red-100 text-red-700' },
}

export function MeineSchichten({ schichten, personId: _personId }: MeineSchichtenProps) {
  const [isPending, startTransition] = useTransition()

  const today = new Date().toISOString().split('T')[0]

  // Filter to upcoming, non-cancelled shifts
  const activeSchichten = schichten.filter((s) => {
    const einsatz = s.helfereinsatz
    return einsatz && einsatz.datum >= today && s.status !== 'abgesagt'
  })

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-CH', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
    })
  }

  const formatTime = (time: string | null) => {
    if (!time) return ''
    return time.substring(0, 5)
  }

  const handleCancel = (schichtId: string) => {
    if (!confirm('Möchtest du deine Anmeldung wirklich absagen?')) return

    startTransition(async () => {
      await cancelSchicht(schichtId)
    })
  }

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="border-b border-green-100 bg-green-50 px-4 py-3">
        <h3 className="font-medium text-green-900">Meine Einsätze</h3>
      </div>

      {activeSchichten.length > 0 ? (
        <div className="divide-y divide-neutral-100">
          {activeSchichten.map((schicht) => {
            const einsatz = schicht.helfereinsatz!
            const statusInfo = STATUS_BADGES[schicht.status] || {
              label: schicht.status,
              color: 'bg-neutral-100 text-neutral-600',
            }
            const rolle = schicht.helferrolle?.rolle

            return (
              <div key={schicht.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/helfereinsaetze/${einsatz.id}` as never}
                      className="text-sm font-medium text-neutral-900 hover:text-blue-600"
                    >
                      {einsatz.titel}
                    </Link>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {einsatz.partner?.name && <span>{einsatz.partner.name} • </span>}
                      {einsatz.ort || 'Kein Ort'}
                    </p>
                    {rolle && (
                      <p className="mt-1 text-xs">
                        <span className="rounded bg-purple-100 px-1.5 py-0.5 text-purple-700">
                          {rolle}
                        </span>
                      </p>
                    )}
                  </div>
                  <div className="text-right ml-3">
                    <p className="text-sm font-medium text-neutral-900">
                      {formatDate(einsatz.datum)}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {formatTime(schicht.startzeit || einsatz.startzeit)}
                      {(schicht.endzeit || einsatz.endzeit) && (
                        <> - {formatTime(schicht.endzeit || einsatz.endzeit)}</>
                      )}
                    </p>
                    <span className={`mt-1 inline-block rounded px-1.5 py-0.5 text-xs ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                {schicht.status === 'zugesagt' && (
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => handleCancel(schicht.id)}
                      disabled={isPending}
                      className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                    >
                      Absagen
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="p-4 text-center text-sm text-neutral-500">
          Keine anstehenden Einsätze
        </div>
      )}

      <div className="border-t border-neutral-100 bg-neutral-50 px-4 py-2">
        <Link
          href="/helfereinsaetze"
          className="text-sm text-green-600 hover:text-green-800"
        >
          Alle Einsätze anzeigen &rarr;
        </Link>
      </div>
    </div>
  )
}
