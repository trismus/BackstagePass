'use client'

import { useState, useTransition } from 'react'
import { Phone, Check, X, Undo2, UserPlus } from 'lucide-react'
import type { ZuweisungMitCheckIn } from '@/lib/supabase/types'
import { checkInHelper, markNoShow, undoCheckIn } from '@/lib/actions/check-in'
import { ErsatzSuchenModal } from './ErsatzSuchenModal'

type HelferCheckInCardProps = {
  zuweisung: ZuweisungMitCheckIn
  onUpdate?: () => void
}

export function HelferCheckInCard({
  zuweisung,
  onUpdate,
}: HelferCheckInCardProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [showErsatzModal, setShowErsatzModal] = useState(false)

  const handleCheckIn = () => {
    setError(null)
    startTransition(async () => {
      const result = await checkInHelper(zuweisung.id)
      if (!result.success) {
        setError(result.error || 'Fehler')
      }
      onUpdate?.()
    })
  }

  const handleNoShow = () => {
    setError(null)
    startTransition(async () => {
      const result = await markNoShow(zuweisung.id)
      if (!result.success) {
        setError(result.error || 'Fehler')
      }
      onUpdate?.()
    })
  }

  const handleUndo = () => {
    setError(null)
    startTransition(async () => {
      const result = await undoCheckIn(zuweisung.id)
      if (!result.success) {
        setError(result.error || 'Fehler')
      }
      onUpdate?.()
    })
  }

  const formatTime = (timestamp: string | null) => {
    if (!timestamp) return null
    return new Date(timestamp).toLocaleTimeString('de-CH', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const statusStyles = {
    erwartet: 'border-l-yellow-500 bg-white',
    anwesend: 'border-l-green-500 bg-green-50',
    no_show: 'border-l-red-500 bg-red-50',
  }

  const statusBadge = {
    erwartet: (
      <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
        Erwartet
      </span>
    ),
    anwesend: (
      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
        Anwesend {zuweisung.checked_in_at && `(${formatTime(zuweisung.checked_in_at)})`}
      </span>
    ),
    no_show: (
      <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
        No-Show
      </span>
    ),
  }

  return (
    <div
      className={`rounded-lg border-l-4 p-4 shadow-sm transition-all ${statusStyles[zuweisung.checkin_status]} ${isPending ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Person Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-lg font-semibold text-gray-900">
              {zuweisung.person.vorname} {zuweisung.person.nachname}
            </h3>
            {statusBadge[zuweisung.checkin_status]}
          </div>
          <p className="mt-1 text-sm text-gray-600">
            {zuweisung.schicht.rolle}
          </p>
          {zuweisung.person.telefon && (
            <a
              href={`tel:${zuweisung.person.telefon}`}
              className="mt-2 inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
            >
              <Phone className="h-4 w-4" />
              {zuweisung.person.telefon}
            </a>
          )}
          {error && (
            <p className="mt-2 text-sm text-red-600">{error}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          {zuweisung.checkin_status === 'erwartet' && (
            <>
              <button
                onClick={handleCheckIn}
                disabled={isPending}
                className="flex min-h-[48px] min-w-[120px] items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Check className="h-5 w-5" />
                Check-in
              </button>
              <button
                onClick={handleNoShow}
                disabled={isPending}
                className="flex min-h-[48px] min-w-[120px] items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-5 w-5" />
                No-Show
              </button>
            </>
          )}
          {zuweisung.checkin_status === 'anwesend' && (
            <button
              onClick={handleUndo}
              disabled={isPending}
              className="flex min-h-[48px] min-w-[120px] items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Undo2 className="h-5 w-5" />
              Zuruecksetzen
            </button>
          )}
          {zuweisung.checkin_status === 'no_show' && (
            <>
              <button
                onClick={() => setShowErsatzModal(true)}
                className="flex min-h-[48px] min-w-[120px] items-center justify-center gap-2 rounded-lg bg-orange-600 px-4 py-2 font-medium text-white transition-colors hover:bg-orange-700"
              >
                <UserPlus className="h-5 w-5" />
                Ersatz finden
              </button>
              <button
                onClick={handleUndo}
                disabled={isPending}
                className="flex min-h-[48px] min-w-[120px] items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Undo2 className="h-5 w-5" />
                Zuruecksetzen
              </button>
            </>
          )}
        </div>
      </div>

      {/* Ersatz Modal */}
      <ErsatzSuchenModal
        open={showErsatzModal}
        onClose={() => setShowErsatzModal(false)}
        schichtId={zuweisung.schicht.id}
        schichtRolle={zuweisung.schicht.rolle}
        zeitfenster={
          zuweisung.schicht.zeitblock
            ? {
                startzeit: zuweisung.schicht.zeitblock.startzeit,
                endzeit: zuweisung.schicht.zeitblock.endzeit,
              }
            : undefined
        }
        originalZuweisungId={zuweisung.id}
        onAssigned={onUpdate}
      />
    </div>
  )
}
