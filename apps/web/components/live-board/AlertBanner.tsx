'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import type { LiveAlert } from '@/lib/actions/live-board'

type AlertBannerProps = {
  alerts: LiveAlert[]
}

export function AlertBanner({ alerts }: AlertBannerProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  // Auto-dismiss after 60 seconds
  useEffect(() => {
    const timers = alerts.map((alert) => {
      return setTimeout(() => {
        setDismissedIds((prev) => new Set([...prev, alert.id]))
      }, 60000)
    })

    return () => {
      timers.forEach((timer) => clearTimeout(timer))
    }
  }, [alerts])

  const visibleAlerts = alerts.filter((a) => !dismissedIds.has(a.id))

  if (visibleAlerts.length === 0) return null

  return (
    <div className="space-y-2">
      {visibleAlerts.map((alert) => (
        <div
          key={alert.id}
          className={`flex items-center justify-between rounded-lg px-4 py-3 ${
            alert.typ === 'kritisch'
              ? 'bg-red-600 text-white'
              : 'bg-orange-500 text-white'
          }`}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-medium">
                {alert.typ === 'kritisch' ? 'Achtung' : 'Warnung'}:{' '}
                {alert.message}
              </p>
              <p className="text-sm opacity-90">
                {alert.zeitblock} - {alert.rolle}
              </p>
            </div>
          </div>
          <button
            onClick={() => setDismissedIds((prev) => new Set([...prev, alert.id]))}
            className="rounded-full p-1 hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      ))}
    </div>
  )
}
