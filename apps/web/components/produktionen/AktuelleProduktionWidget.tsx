'use client'

import Link from 'next/link'
import type { Route } from 'next'
import type { Produktion, ProduktionStatus } from '@/lib/supabase/types'
import { ProduktionStatusBadge } from './ProduktionStatusBadge'

interface AktuelleProduktionWidgetProps {
  produktionen: Produktion[]
}

// Determines which production is "current" based on status and dates
function findAktuelleProduktion(produktionen: Produktion[]): Produktion | null {
  // Priority 1: Production currently running (status: laufend)
  const laufend = produktionen.filter((p) => p.status === 'laufend')
  if (laufend.length > 0) {
    // Return the one with earliest premiere
    return laufend.sort((a, b) => {
      if (!a.premiere) return 1
      if (!b.premiere) return -1
      return new Date(a.premiere).getTime() - new Date(b.premiere).getTime()
    })[0]
  }

  // Priority 2: Production in premiere phase
  const premiere = produktionen.filter((p) => p.status === 'premiere')
  if (premiere.length > 0) return premiere[0]

  // Priority 3: Production in proben phase, closest to premiere
  const proben = produktionen.filter((p) => p.status === 'proben')
  if (proben.length > 0) {
    return proben.sort((a, b) => {
      if (!a.premiere) return 1
      if (!b.premiere) return -1
      return new Date(a.premiere).getTime() - new Date(b.premiere).getTime()
    })[0]
  }

  // Priority 4: Any active production (not abgeschlossen or abgesagt)
  const active = produktionen.filter(
    (p) => !['abgeschlossen', 'abgesagt'].includes(p.status)
  )
  if (active.length > 0) {
    // Return the one with the most advanced status
    const statusOrder: ProduktionStatus[] = [
      'casting',
      'planung',
      'draft',
    ]
    for (const status of statusOrder) {
      const found = active.find((p) => p.status === status)
      if (found) return found
    }
    return active[0]
  }

  return null
}

export function AktuelleProduktionWidget({
  produktionen,
}: AktuelleProduktionWidgetProps) {
  const aktuelle = findAktuelleProduktion(produktionen)

  if (!aktuelle) {
    return (
      <div className="rounded-lg bg-gradient-to-r from-primary-50 to-secondary-50 p-6">
        <h3 className="font-semibold text-gray-700">Aktuelle Produktion</h3>
        <p className="mt-2 text-sm text-gray-500">
          Keine aktive Produktion vorhanden.
        </p>
      </div>
    )
  }

  const daysUntilPremiere = aktuelle.premiere
    ? Math.ceil(
        (new Date(aktuelle.premiere).getTime() - new Date().getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : null

  return (
    <Link
      href={`/produktionen/${aktuelle.id}` as Route}
      className="block rounded-lg bg-gradient-to-r from-primary-600 to-secondary-600 p-6 text-white shadow-lg transition-transform hover:scale-[1.01]"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-white/80">
            Aktuelle Produktion
          </p>
          <h3 className="mt-1 text-xl font-bold">{aktuelle.titel}</h3>
          <p className="mt-0.5 text-sm text-white/80">
            Saison {aktuelle.saison}
          </p>
        </div>
        <ProduktionStatusBadge status={aktuelle.status} variant="light" />
      </div>

      {/* Key dates */}
      <div className="mt-4 grid gap-2 text-sm sm:grid-cols-3">
        {aktuelle.proben_start && (
          <div>
            <span className="text-white/70">Probenstart:</span>
            <div className="font-medium">
              {new Date(aktuelle.proben_start).toLocaleDateString('de-CH')}
            </div>
          </div>
        )}
        {aktuelle.premiere && (
          <div>
            <span className="text-white/70">Premiere:</span>
            <div className="font-medium">
              {new Date(aktuelle.premiere).toLocaleDateString('de-CH')}
            </div>
          </div>
        )}
        {aktuelle.derniere && (
          <div>
            <span className="text-white/70">Derniere:</span>
            <div className="font-medium">
              {new Date(aktuelle.derniere).toLocaleDateString('de-CH')}
            </div>
          </div>
        )}
      </div>

      {/* Countdown to premiere if applicable */}
      {daysUntilPremiere !== null && daysUntilPremiere > 0 && (
        <div className="mt-4 inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-sm">
          <span className="font-bold">{daysUntilPremiere}</span>
          <span className="ml-1 text-white/90">
            {daysUntilPremiere === 1 ? 'Tag' : 'Tage'} bis zur Premiere
          </span>
        </div>
      )}
      {daysUntilPremiere !== null && daysUntilPremiere <= 0 && (
        <div className="mt-4 inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-sm font-medium">
          Premiere {daysUntilPremiere === 0 ? 'heute!' : 'war vor ' + Math.abs(daysUntilPremiere) + ' Tagen'}
        </div>
      )}
    </Link>
  )
}
