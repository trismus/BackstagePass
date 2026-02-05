'use client'

import { Clock, CheckCircle, Timer } from 'lucide-react'
import type { LiveZeitblock } from '@/lib/actions/live-board'
import { SchichtStatusCard } from './SchichtStatusCard'

type ZeitblockStatusProps = {
  zeitblock: LiveZeitblock
  isActive: boolean
}

export function ZeitblockStatus({ zeitblock, isActive }: ZeitblockStatusProps) {
  const formatTime = (time: string) => time.slice(0, 5)

  const statusStyles = {
    geplant: {
      badge: 'bg-gray-600 text-gray-300',
      border: 'border-gray-600',
      icon: <Timer className="h-5 w-5 text-gray-400" />,
    },
    aktiv: {
      badge: 'bg-blue-600 text-white',
      border: 'border-blue-500',
      icon: <Clock className="h-5 w-5 text-blue-400" />,
    },
    abgeschlossen: {
      badge: 'bg-green-600 text-white',
      border: 'border-green-600',
      icon: <CheckCircle className="h-5 w-5 text-green-400" />,
    },
  }

  const style = statusStyles[zeitblock.status]

  return (
    <div
      className={`rounded-xl border-2 bg-gray-900/50 ${style.border} ${isActive ? 'ring-2 ring-blue-400' : ''}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-700 px-6 py-4">
        <div className="flex items-center gap-3">
          {style.icon}
          <div>
            <h3 className="text-xl font-bold text-white">{zeitblock.name}</h3>
            <p className="text-sm text-gray-400">
              {formatTime(zeitblock.startzeit)} - {formatTime(zeitblock.endzeit)}
            </p>
          </div>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${style.badge}`}>
          {zeitblock.status === 'geplant' && 'Geplant'}
          {zeitblock.status === 'aktiv' && 'Aktiv'}
          {zeitblock.status === 'abgeschlossen' && 'Abgeschlossen'}
        </span>
      </div>

      {/* Schichten Grid */}
      <div className="grid gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">
        {zeitblock.schichten.length === 0 ? (
          <p className="col-span-full text-center text-gray-500">
            Keine Schichten in diesem Zeitblock
          </p>
        ) : (
          zeitblock.schichten.map((schicht) => (
            <SchichtStatusCard key={schicht.id} schicht={schicht} />
          ))
        )}
      </div>
    </div>
  )
}
