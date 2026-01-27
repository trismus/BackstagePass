'use client'

import Link from 'next/link'
import { useTransition } from 'react'
import { signUpForEinsatz } from '@/lib/actions/helferschichten'

interface Einsatz {
  id: string
  titel: string
  datum: string
  startzeit: string | null
  endzeit: string | null
  ort: string | null
  status: string
  helfer_max: number | null
  partner: { name: string } | null
  helferschichten: { id: string }[] | null
}

interface VerfuegbareEinsaetzeProps {
  einsaetze: Einsatz[]
  personId?: string
}

export function VerfuegbareEinsaetze({ einsaetze, personId }: VerfuegbareEinsaetzeProps) {
  const [isPending, startTransition] = useTransition()

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

  const handleSignUp = (einsatzId: string) => {
    if (!personId) {
      alert('Du bist noch nicht mit einem Mitgliederprofil verknüpft.')
      return
    }

    startTransition(async () => {
      const result = await signUpForEinsatz(einsatzId, personId)
      if (!result.success) {
        alert(result.error || 'Fehler bei der Anmeldung')
      }
    })
  }

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="border-b border-blue-100 bg-blue-50 px-4 py-3">
        <h3 className="font-medium text-blue-900">Verfügbare Einsätze</h3>
      </div>

      {einsaetze.length > 0 ? (
        <div className="divide-y divide-neutral-100">
          {einsaetze.map((einsatz) => {
            const schichtenArray = einsatz.helferschichten as { id: string }[] | null
            const currentHelpers = schichtenArray?.length ?? 0
            const maxHelpers = einsatz.helfer_max
            const spotsLeft = maxHelpers ? maxHelpers - currentHelpers : null
            const isFull = spotsLeft !== null && spotsLeft <= 0

            return (
              <div key={einsatz.id} className="p-4">
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
                  </div>
                  <div className="text-right ml-3">
                    <p className="text-sm font-medium text-neutral-900">
                      {formatDate(einsatz.datum)}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {formatTime(einsatz.startzeit)}
                      {einsatz.endzeit && <> - {formatTime(einsatz.endzeit)}</>}
                    </p>
                    {spotsLeft !== null && (
                      <p className={`mt-1 text-xs ${isFull ? 'text-red-600' : 'text-green-600'}`}>
                        {isFull ? 'Voll' : `${spotsLeft} Plätze frei`}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {!isFull && personId && (
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => handleSignUp(einsatz.id)}
                      disabled={isPending}
                      className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isPending ? 'Anmelden...' : 'Anmelden'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="p-4 text-center text-sm text-neutral-500">
          Keine verfügbaren Einsätze
        </div>
      )}

      <div className="border-t border-neutral-100 bg-neutral-50 px-4 py-2">
        <Link
          href="/helfereinsaetze"
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          Alle Einsätze anzeigen &rarr;
        </Link>
      </div>
    </div>
  )
}
