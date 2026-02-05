'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Clock } from 'lucide-react'
import type { ZeitblockMitCheckIns } from '@/lib/supabase/types'
import { HelferCheckInCard } from './HelferCheckInCard'

type ZeitblockCheckInSectionProps = {
  zeitblock: ZeitblockMitCheckIns
  isCurrentBlock?: boolean
  defaultExpanded?: boolean
  onUpdate?: () => void
}

export function ZeitblockCheckInSection({
  zeitblock,
  isCurrentBlock,
  defaultExpanded,
  onUpdate,
}: ZeitblockCheckInSectionProps) {
  const [isExpanded, setIsExpanded] = useState(
    defaultExpanded ?? isCurrentBlock ?? zeitblock.status === 'aktiv'
  )

  const formatTime = (time: string) => time.slice(0, 5)

  const statusBadge = {
    geplant: (
      <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
        Geplant
      </span>
    ),
    aktiv: (
      <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
        Aktiv
      </span>
    ),
    abgeschlossen: (
      <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
        Abgeschlossen
      </span>
    ),
  }

  const progressPercent =
    zeitblock.stats.total > 0
      ? Math.round((zeitblock.stats.eingecheckt / zeitblock.stats.total) * 100)
      : 0

  return (
    <div
      className={`overflow-hidden rounded-lg border ${isCurrentBlock ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}`}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex w-full items-center justify-between bg-white p-4 text-left hover:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
            <Clock className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{zeitblock.name}</h3>
              {statusBadge[zeitblock.status]}
            </div>
            <p className="text-sm text-gray-500">
              {formatTime(zeitblock.startzeit)} - {formatTime(zeitblock.endzeit)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Mini Progress */}
          <div className="hidden items-center gap-2 sm:flex">
            <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-green-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-sm text-gray-600">
              {zeitblock.stats.eingecheckt}/{zeitblock.stats.total}
            </span>
          </div>

          {/* No-Show Warning */}
          {zeitblock.stats.no_show > 0 && (
            <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
              {zeitblock.stats.no_show} No-Show
            </span>
          )}

          {/* Toggle Icon */}
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 bg-gray-50 p-4">
          {zeitblock.zuweisungen.length === 0 ? (
            <p className="py-4 text-center text-gray-500">
              Keine Helfer in diesem Zeitblock
            </p>
          ) : (
            <div className="space-y-3">
              {zeitblock.zuweisungen.map((zuweisung) => (
                <HelferCheckInCard
                  key={zuweisung.id}
                  zuweisung={zuweisung}
                  onUpdate={onUpdate}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
