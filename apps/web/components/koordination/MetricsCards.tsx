'use client'

import type { KoordinationMetrics } from '@/lib/actions/koordination'

interface MetricsCardsProps {
  metrics: KoordinationMetrics
  helferStatus: string | null
}

export function MetricsCards({ metrics, helferStatus }: MetricsCardsProps) {
  const statusLabels: Record<string, { label: string; color: string }> = {
    entwurf: { label: 'Entwurf', color: 'bg-gray-100 text-gray-800' },
    veroeffentlicht: { label: 'Veroffentlicht', color: 'bg-green-100 text-green-800' },
    abgeschlossen: { label: 'Abgeschlossen', color: 'bg-blue-100 text-blue-800' },
  }

  const statusInfo = statusLabels[helferStatus || 'entwurf'] || statusLabels.entwurf

  // Color based on percentage
  const getAuslastungColor = (prozent: number) => {
    if (prozent >= 80) return 'text-green-600'
    if (prozent >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {/* Status Badge */}
      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <p className="text-sm font-medium text-neutral-500">Status</p>
        <div className="mt-2">
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-medium ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>
      </div>

      {/* Gesamt Slots */}
      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <p className="text-sm font-medium text-neutral-500">Gesamt Slots</p>
        <p className="mt-2 text-2xl font-bold text-neutral-900">
          {metrics.gesamtSlots}
        </p>
        <p className="text-xs text-neutral-500">definiert</p>
      </div>

      {/* Besetzt */}
      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <p className="text-sm font-medium text-neutral-500">Besetzt</p>
        <p className={`mt-2 text-2xl font-bold ${getAuslastungColor(metrics.auslastungProzent)}`}>
          {metrics.besetztSlots}
          <span className="ml-1 text-sm font-normal">
            ({metrics.auslastungProzent}%)
          </span>
        </p>
        <p className="text-xs text-neutral-500">zugewiesen</p>
      </div>

      {/* Offen */}
      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <p className="text-sm font-medium text-neutral-500">Offen</p>
        <p className={`mt-2 text-2xl font-bold ${metrics.offeneSlots > 0 ? 'text-orange-600' : 'text-green-600'}`}>
          {metrics.offeneSlots}
        </p>
        <p className="text-xs text-neutral-500">noch frei</p>
      </div>

      {/* Warteliste */}
      <div className="rounded-lg border border-neutral-200 bg-white p-4">
        <p className="text-sm font-medium text-neutral-500">Warteliste</p>
        <p className={`mt-2 text-2xl font-bold ${metrics.warteliste > 0 ? 'text-blue-600' : 'text-neutral-400'}`}>
          {metrics.warteliste}
        </p>
        <p className="text-xs text-neutral-500">wartend</p>
      </div>
    </div>
  )
}
