'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Maximize2, Minimize2, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { LiveBoardData } from '@/lib/actions/live-board'
import { AlertBanner } from './AlertBanner'
import { ZeitblockStatus } from './ZeitblockStatus'

type TimelineViewProps = {
  initialData: LiveBoardData
}

export function TimelineView({ initialData }: TimelineViewProps) {
  const router = useRouter()
  const [data] = useState(initialData)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isKioskMode, setIsKioskMode] = useState(false)
  const [showOnlyActive, setShowOnlyActive] = useState(false)
  const [highlightCritical, setHighlightCritical] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const refreshTimer = setInterval(() => {
      router.refresh()
    }, 30000)
    return () => clearInterval(refreshTimer)
  }, [router])

  // Supabase Realtime subscription
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('liveboard-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'auffuehrung_zuweisungen',
        },
        () => {
          router.refresh()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [router])

  // Manual refresh
  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    router.refresh()
    setTimeout(() => setIsRefreshing(false), 500)
  }, [router])

  // Toggle kiosk mode
  const toggleKioskMode = useCallback(() => {
    if (!isKioskMode) {
      document.documentElement.requestFullscreen?.()
      // Wake Lock API to prevent screen sleep
      if ('wakeLock' in navigator) {
        (navigator as Navigator & { wakeLock: { request: (type: string) => Promise<unknown> } }).wakeLock.request('screen').catch(console.error)
      }
    } else {
      document.exitFullscreen?.()
    }
    setIsKioskMode(!isKioskMode)
  }, [isKioskMode])

  // Find current zeitblock
  const getCurrentZeitblockId = () => {
    const now = new Date()
    for (const zb of data.zeitbloecke) {
      const start = new Date(`${data.veranstaltung.datum}T${zb.startzeit}`)
      const end = new Date(`${data.veranstaltung.datum}T${zb.endzeit}`)
      if (now >= start && now <= end) {
        return zb.id
      }
    }
    return null
  }

  const currentZeitblockId = getCurrentZeitblockId()

  // Filter zeitbloecke based on settings
  const displayedZeitbloecke = data.zeitbloecke.filter((zb) => {
    if (showOnlyActive && zb.status !== 'aktiv') return false
    return true
  })

  // Calculate overall progress
  const progressPercent =
    data.stats.total > 0
      ? Math.round((data.stats.eingecheckt / data.stats.total) * 100)
      : 0

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-gray-800 bg-gray-900">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Left: Event Info */}
          <div>
            <h1 className="text-2xl font-bold">{data.veranstaltung.titel}</h1>
            <p className="text-gray-400">
              {new Date(data.veranstaltung.datum).toLocaleDateString('de-CH', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>

          {/* Center: Live Clock */}
          <div className="text-center">
            <p className="text-sm text-gray-500">Aktuelle Zeit</p>
            <p className="font-mono text-4xl font-bold text-blue-400">
              {currentTime.toLocaleTimeString('de-CH', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </p>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="rounded-lg bg-gray-800 p-2 text-gray-400 hover:bg-gray-700 hover:text-white"
              title="Aktualisieren"
            >
              <RefreshCw
                className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`}
              />
            </button>
            <button
              onClick={toggleKioskMode}
              className="rounded-lg bg-gray-800 p-2 text-gray-400 hover:bg-gray-700 hover:text-white"
              title={isKioskMode ? 'Kiosk-Modus beenden' : 'Kiosk-Modus'}
            >
              {isKioskMode ? (
                <Minimize2 className="h-5 w-5" />
              ) : (
                <Maximize2 className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Overall Stats */}
        <div className="border-t border-gray-800 px-6 py-3">
          <div className="flex items-center gap-6">
            {/* Progress Bar */}
            <div className="flex-1">
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="text-gray-400">Gesamt-Check-in</span>
                <span className="font-medium">{progressPercent}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-800">
                <div
                  className="h-2 rounded-full bg-green-500 transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="flex gap-4 text-sm">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">
                  {data.stats.eingecheckt}
                </p>
                <p className="text-gray-500">Eingecheckt</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-400">
                  {data.stats.erwartet}
                </p>
                <p className="text-gray-500">Erwartet</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-400">
                  {data.stats.noShow}
                </p>
                <p className="text-gray-500">No-Show</p>
              </div>
            </div>

            {/* Filter Toggles */}
            <div className="flex items-center gap-2">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={showOnlyActive}
                  onChange={(e) => setShowOnlyActive(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-400">Nur aktive</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={highlightCritical}
                  onChange={(e) => setHighlightCritical(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-400">Kritische hervorheben</span>
              </label>
            </div>
          </div>
        </div>
      </header>

      {/* Alerts */}
      {data.alerts.length > 0 && (
        <div className="px-6 py-4">
          <AlertBanner alerts={data.alerts} />
        </div>
      )}

      {/* Zeitblock Timeline */}
      <main className="space-y-6 p-6">
        {displayedZeitbloecke.length === 0 ? (
          <div className="py-12 text-center text-gray-500">
            Keine Zeitbloecke gefunden
          </div>
        ) : (
          displayedZeitbloecke.map((zeitblock) => (
            <ZeitblockStatus
              key={zeitblock.id}
              zeitblock={zeitblock}
              isActive={zeitblock.id === currentZeitblockId}
            />
          ))
        )}
      </main>
    </div>
  )
}
