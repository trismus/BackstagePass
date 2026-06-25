'use client'

import { useState, useMemo } from 'react'
import type {
  SchichtenDashboardData,
  DashboardAuffuehrung,
  AmpelStatus,
} from '@/lib/supabase/types'
import { DashboardStats } from './DashboardStats'
import { DashboardFilter } from './DashboardFilter'
import { AuffuehrungAccordion } from './AuffuehrungAccordion'
import { TopHelferList } from './TopHelferList'

// =============================================================================
// Types
// =============================================================================

interface SchichtenDashboardProps {
  /** System B data (leading system) */
  dashboardData: SchichtenDashboardData
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
 * Shows aggregated stats and collapsible performance cards with Zeitblöcke,
 * Schichten, and Zuweisungen (System B - the leading helper system).
 */
export function SchichtenDashboard({ dashboardData }: SchichtenDashboardProps) {
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
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
        {/* Left column: Stats + Filter + Aufführungen */}
        <div className="space-y-6">
          <DashboardStats
            stats={dashboardData.stats}
            auffuehrungenCount={dashboardData.auffuehrungen.length}
          />

          <DashboardFilter
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            ampelFilter={ampelFilter}
            onAmpelFilterChange={setAmpelFilter}
          />

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

        {/* Right column: Top Helfer sidebar */}
        <div className="xl:sticky xl:top-4 xl:self-start">
          <TopHelferList helfer={dashboardData.top_helfer} />
        </div>
      </div>
    </div>
  )
}
