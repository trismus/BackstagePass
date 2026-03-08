'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type { HelferEventBelegung, AmpelStatus } from '@/lib/supabase/types'

// =============================================================================
// Types
// =============================================================================

interface HelferlisteOverviewProps {
  events: HelferEventBelegung[]
  error?: string
}

// =============================================================================
// Main Component
// =============================================================================

export function HelferlisteOverview({ events, error }: HelferlisteOverviewProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [ampelFilter, setAmpelFilter] = useState<AmpelStatus | 'alle'>('alle')

  const filteredEvents = useMemo(() => {
    let result = events

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          (e.ort && e.ort.toLowerCase().includes(q))
      )
    }

    if (ampelFilter !== 'alle') {
      result = result.filter((e) => e.ampel === ampelFilter)
    }

    return result
  }, [events, searchQuery, ampelFilter])

  // Summary stats
  const summary = useMemo(() => {
    const totalEvents = events.length
    const totalBenoetigt = events.reduce((s, e) => s + e.total_benoetigt, 0)
    const totalBelegt = events.reduce((s, e) => s + e.total_belegt, 0)
    const kritisch = events.filter((e) => e.ampel === 'rot').length
    const fillPct = totalBenoetigt > 0
      ? Math.round((totalBelegt / totalBenoetigt) * 100)
      : 0

    return { totalEvents, totalBenoetigt, totalBelegt, kritisch, fillPct }
  }, [events])

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-800">{error}</p>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center">
        <p className="text-neutral-500">
          Keine zukünftigen Helfer-Events vorhanden
        </p>
        <Link
          href={"/helferliste" as never}
          className="mt-3 inline-block text-sm font-medium text-primary-600 hover:text-primary-800"
        >
          Helferliste verwalten &rarr;
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Bar */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <SummaryCard label="Events" value={summary.totalEvents} />
        <SummaryCard
          label="Besetzung"
          value={`${summary.totalBelegt}/${summary.totalBenoetigt}`}
          badge={`${summary.fillPct}%`}
          badgeColor={
            summary.fillPct >= 100
              ? 'gruen'
              : summary.fillPct >= 50
                ? 'gelb'
                : 'rot'
          }
        />
        <SummaryCard
          label="Kritisch"
          value={summary.kritisch}
          badgeColor={summary.kritisch > 0 ? 'rot' : 'gruen'}
        />
        <SummaryCard
          label="Rollen total"
          value={events.reduce((s, e) => s + e.rollen_count, 0)}
        />
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Event suchen..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-64 rounded-lg border border-neutral-300 px-3 py-2 text-sm placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
        <div className="flex gap-1">
          {(['alle', 'gruen', 'gelb', 'rot'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setAmpelFilter(filter)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                ampelFilter === filter
                  ? 'bg-neutral-900 text-white'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {filter === 'alle' && 'Alle'}
              {filter === 'gruen' && 'Voll besetzt'}
              {filter === 'gelb' && 'Teilweise'}
              {filter === 'rot' && 'Kritisch'}
            </button>
          ))}
        </div>
      </div>

      {/* Event List */}
      {filteredEvents.length === 0 ? (
        <div className="rounded-lg bg-neutral-50 p-6 text-center">
          <p className="text-neutral-500">
            Keine Events gefunden
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((event) => (
            <EventCard key={event.event_id} event={event} />
          ))}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// Summary Card
// =============================================================================

function SummaryCard({
  label,
  value,
  badge,
  badgeColor,
}: {
  label: string
  value: number | string
  badge?: string
  badgeColor?: AmpelStatus
}) {
  const colorMap: Record<AmpelStatus, string> = {
    gruen: 'bg-success-100 text-success-700',
    gelb: 'bg-amber-100 text-amber-700',
    rot: 'bg-red-100 text-red-700',
  }

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <p className="text-xs font-medium text-neutral-500">{label}</p>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-xl font-semibold text-neutral-900">{value}</span>
        {badge && badgeColor && (
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${colorMap[badgeColor]}`}
          >
            {badge}
          </span>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// Event Card
// =============================================================================

function EventCard({ event }: { event: HelferEventBelegung }) {
  const fillPct =
    event.total_benoetigt > 0
      ? Math.round((event.total_belegt / event.total_benoetigt) * 100)
      : 100

  const ampelColors: Record<AmpelStatus, string> = {
    gruen: 'bg-success-500',
    gelb: 'bg-amber-400',
    rot: 'bg-red-400',
  }

  const ampelDotColors: Record<AmpelStatus, string> = {
    gruen: 'bg-success-500',
    gelb: 'bg-amber-400',
    rot: 'bg-red-400',
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('de-CH', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString('de-CH', {
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <Link
      href={`/vorstand/helferliste/${event.event_id}` as never}
      className="block rounded-xl border border-neutral-200 bg-white p-4 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {/* Ampel dot */}
            <span
              className={`inline-block h-3 w-3 shrink-0 rounded-full ${ampelDotColors[event.ampel]}`}
            />
            <h3 className="truncate text-base font-semibold text-neutral-900">
              {event.name}
            </h3>
          </div>

          <p className="mt-1 text-sm text-neutral-500">
            {formatDate(event.datum_start)}
            {' '}
            {formatTime(event.datum_start)}
            {event.ort && ` \u00B7 ${event.ort}`}
          </p>

          <div className="mt-2 flex items-center gap-3">
            <span className="text-xs text-neutral-500">
              {event.rollen_count} Rolle{event.rollen_count !== 1 ? 'n' : ''}
            </span>
            <span className="text-xs text-neutral-400">&middot;</span>
            <span className="text-xs text-neutral-500">
              {event.total_belegt}/{event.total_benoetigt} besetzt
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-28 shrink-0">
          <div className="flex items-center justify-between text-xs text-neutral-500">
            <span>{event.total_belegt}/{event.total_benoetigt}</span>
            <span>{Math.min(fillPct, 100)}%</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-neutral-100">
            <div
              className={`h-full rounded-full transition-all ${ampelColors[event.ampel]}`}
              style={{ width: `${Math.min(100, fillPct)}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  )
}
