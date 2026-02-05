'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { CheckInOverview, ZuweisungMitCheckIn } from '@/lib/supabase/types'
import { CheckInStats } from './CheckInStats'
import { ZeitblockCheckInSection } from './ZeitblockCheckInSection'

type CheckInListProps = {
  initialData: CheckInOverview
}

type FilterType = 'alle' | 'erwartet' | 'anwesend' | 'no_show'

export function CheckInList({ initialData }: CheckInListProps) {
  const router = useRouter()
  const [data] = useState(initialData)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<FilterType>('alle')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Set up Supabase Realtime subscription
  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('checkin-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'auffuehrung_zuweisungen',
        },
        () => {
          // Refresh data when any zuweisung is updated
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

  // Filter and search zuweisungen
  const filterZuweisungen = (zuweisungen: ZuweisungMitCheckIn[]) => {
    return zuweisungen.filter((z) => {
      // Apply status filter
      if (filter !== 'alle' && z.checkin_status !== filter) {
        return false
      }

      // Apply search
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const fullName = `${z.person.vorname} ${z.person.nachname}`.toLowerCase()
        const rolle = z.schicht.rolle.toLowerCase()
        return fullName.includes(query) || rolle.includes(query)
      }

      return true
    })
  }

  // Calculate filtered stats
  const allZuweisungen = data.zeitbloecke.flatMap((zb) => zb.zuweisungen)
  const filteredZuweisungen = filterZuweisungen(allZuweisungen)

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

  return (
    <div className="space-y-6">
      {/* Live Clock */}
      <div className="flex items-center justify-between rounded-lg bg-gray-900 px-4 py-3 text-white">
        <div>
          <p className="text-sm text-gray-400">Aktuelle Zeit</p>
          <p className="text-2xl font-mono font-bold">
            {currentTime.toLocaleTimeString('de-CH', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 rounded-lg bg-gray-700 px-3 py-2 text-sm text-white transition-colors hover:bg-gray-600"
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
          />
          Aktualisieren
        </button>
      </div>

      {/* Stats */}
      <CheckInStats
        total={data.stats.total}
        eingecheckt={data.stats.eingecheckt}
        noShow={data.stats.no_show}
        erwartet={data.stats.erwartet}
      />

      {/* Search and Filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Name oder Rolle suchen..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('alle')}
            className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
              filter === 'alle'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Alle
          </button>
          <button
            onClick={() => setFilter('erwartet')}
            className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
              filter === 'erwartet'
                ? 'bg-yellow-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Erwartet
          </button>
          <button
            onClick={() => setFilter('no_show')}
            className={`rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
              filter === 'no_show'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            No-Show
          </button>
        </div>
      </div>

      {/* Zeitblock Sections */}
      <div className="space-y-4">
        {data.zeitbloecke.map((zeitblock) => {
          const filteredZb = {
            ...zeitblock,
            zuweisungen: filterZuweisungen(zeitblock.zuweisungen),
          }

          // Skip empty zeitblocks after filtering
          if (filteredZb.zuweisungen.length === 0 && filter !== 'alle') {
            return null
          }

          return (
            <ZeitblockCheckInSection
              key={zeitblock.id}
              zeitblock={filteredZb}
              isCurrentBlock={zeitblock.id === currentZeitblockId}
              onUpdate={handleRefresh}
            />
          )
        })}
      </div>

      {/* No Results */}
      {filteredZuweisungen.length === 0 && (
        <div className="rounded-lg border border-gray-200 bg-white py-12 text-center">
          <p className="text-gray-500">
            {searchQuery
              ? 'Keine Helfer gefunden'
              : 'Keine Helfer in dieser Kategorie'}
          </p>
        </div>
      )}
    </div>
  )
}
