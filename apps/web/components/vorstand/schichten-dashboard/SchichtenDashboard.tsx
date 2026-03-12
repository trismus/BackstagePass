'use client'

import { useState, useMemo } from 'react'
import type {
  SchichtenDashboardData,
  DashboardAuffuehrung,
  AmpelStatus,
  HelferEventBelegung,
} from '@/lib/supabase/types'
import { DashboardStats } from './DashboardStats'
import { DashboardFilter } from './DashboardFilter'
import { AuffuehrungAccordion } from './AuffuehrungAccordion'
import { LegacyHelferlisteTab } from './LegacyHelferlisteTab'
import { TopHelferList } from './TopHelferList'

// =============================================================================
// Types
// =============================================================================

type ActiveTab = 'system-b' | 'system-a'

interface SchichtenDashboardProps {
  /** System B data (leading system) */
  dashboardData: SchichtenDashboardData
  /** System A data (legacy, read-only) */
  legacyEvents: HelferEventBelegung[]
  legacyError?: string
}

// =============================================================================
// Search helper: checks if a query matches any text in the auffuehrung
// =============================================================================

function matchesSearch(auffuehrung: DashboardAuffuehrung, query: string): boolean {
  const q = query.toLowerCase()

  // Match on title
  if (auffuehrung.titel.toLowerCase().includes(q)) return true

  // Match on ort
  if (auffuehrung.ort?.toLowerCase().includes(q)) return true

  // Match on schicht rolle names
  for (const zb of auffuehrung.zeitbloecke) {
    for (const schicht of zb.schichten) {
      if (schicht.rolle.toLowerCase().includes(q)) return true

      // Match on helper names
      for (const z of schicht.zuweisungen) {
        if (z.name.toLowerCase().includes(q)) return true
      }
    }
  }

  return false
}

// =============================================================================
// Component
// =============================================================================

/**
 * Main Schichten-Dashboard component.
 * Combines System B (leading) and System A (legacy) data in a tabbed view.
 * System B is the default tab showing aggregated stats and collapsible
 * performance cards with Zeitblöcke, Schichten, and Zuweisungen.
 */
export function SchichtenDashboard({
  dashboardData,
  legacyEvents,
  legacyError,
}: SchichtenDashboardProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('system-b')
  const [searchQuery, setSearchQuery] = useState('')
  const [ampelFilter, setAmpelFilter] = useState<AmpelStatus | 'alle'>('alle')

  // Filter auffuehrungen based on search and ampel filter
  const filteredAuffuehrungen = useMemo(() => {
    let result = dashboardData.auffuehrungen

    if (searchQuery) {
      result = result.filter((a) => matchesSearch(a, searchQuery))
    }

    if (ampelFilter !== 'alle') {
      result = result.filter((a) => a.ampel === ampelFilter)
    }

    return result
  }, [dashboardData.auffuehrungen, searchQuery, ampelFilter])

  return (
    <div className="space-y-6">
      {/* Tab switcher */}
      <div className="flex border-b border-neutral-200">
        <button
          type="button"
          onClick={() => setActiveTab('system-b')}
          className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'system-b'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700'
          }`}
        >
          Schichten-Übersicht
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('system-a')}
          className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'system-a'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700'
          }`}
        >
          Bisherige Events
          {legacyEvents.length > 0 && (
            <span className="ml-1.5 rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
              {legacyEvents.length}
            </span>
          )}
        </button>
      </div>

      {/* System B tab content */}
      {activeTab === 'system-b' && (
        <div className="space-y-6">
          {/* Aggregated stats + Top Helfer */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
            <div className="space-y-6">
              {/* Aggregated stats */}
              <DashboardStats
                stats={dashboardData.stats}
                auffuehrungenCount={dashboardData.auffuehrungen.length}
              />
            </div>

            {/* Top Helfer sidebar */}
            <TopHelferList helfer={dashboardData.top_helfer} />
          </div>

          {/* Filter bar */}
          <DashboardFilter
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            ampelFilter={ampelFilter}
            onAmpelFilterChange={setAmpelFilter}
          />

          {/* Auffuehrungen list */}
          {filteredAuffuehrungen.length === 0 ? (
            <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center">
              <p className="text-neutral-500">
                {dashboardData.auffuehrungen.length === 0
                  ? 'Keine kommenden Aufführungen mit Schichten vorhanden'
                  : 'Keine Aufführungen entsprechen den Filterkriterien'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAuffuehrungen.map((auffuehrung) => (
                <AuffuehrungAccordion
                  key={auffuehrung.id}
                  auffuehrung={auffuehrung}
                  defaultOpen={auffuehrung.ampel === 'rot'}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* System A tab content */}
      {activeTab === 'system-a' && (
        <LegacyHelferlisteTab events={legacyEvents} error={legacyError} />
      )}
    </div>
  )
}
