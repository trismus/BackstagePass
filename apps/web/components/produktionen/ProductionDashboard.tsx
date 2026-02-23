'use client'

import Link from 'next/link'
import type { ProductionProgress } from '@/lib/actions/mitglieder-integration'

interface ProductionDashboardProps {
  productions: ProductionProgress[]
}

function ProgressBar({ current, total, color }: { current: number; total: number; color: string }) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0

  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs font-medium text-gray-600">
        {current}/{total}
      </span>
    </div>
  )
}

function formatDate(datum: string | null): string {
  if (!datum) return '-'
  return new Date(datum).toLocaleDateString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function ProductionDashboard({ productions }: ProductionDashboardProps) {
  if (productions.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-500">Keine aktiven Produktionen</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {productions.map((prod) => (
        <div
          key={prod.stueck_id}
          className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
        >
          <div className="border-b border-gray-200 bg-gray-50 px-5 py-3">
            <Link
              href={`/stuecke/${prod.stueck_id}` as never}
              className="text-lg font-semibold text-gray-900 hover:text-blue-600"
            >
              {prod.stueck_titel}
            </Link>
          </div>

          <div className="space-y-4 p-5">
            {/* Casting Progress */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Besetzung</span>
                <span className="text-xs text-gray-500">
                  {prod.rollen_total > 0
                    ? `${Math.round((prod.rollen_besetzt / prod.rollen_total) * 100)}%`
                    : '-'}
                </span>
              </div>
              <ProgressBar
                current={prod.rollen_besetzt}
                total={prod.rollen_total}
                color="bg-purple-500"
              />
            </div>

            {/* Shift Progress */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Schichten besetzt</span>
                <span className="text-xs text-gray-500">
                  {prod.schichten_total > 0
                    ? `${Math.round((prod.schichten_besetzt / prod.schichten_total) * 100)}%`
                    : '-'}
                </span>
              </div>
              <ProgressBar
                current={prod.schichten_besetzt}
                total={prod.schichten_total}
                color="bg-blue-500"
              />
            </div>

            {/* Rehearsal Progress */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Proben</span>
                <span className="text-xs text-gray-500">
                  {prod.proben_total > 0
                    ? `${Math.round((prod.proben_abgeschlossen / prod.proben_total) * 100)}%`
                    : '-'}
                </span>
              </div>
              <ProgressBar
                current={prod.proben_abgeschlossen}
                total={prod.proben_total}
                color="bg-amber-500"
              />
            </div>

            {/* Key Dates */}
            <div className="flex justify-between border-t border-gray-100 pt-3 text-xs text-gray-500">
              <span>
                Nächste Probe: {formatDate(prod.naechste_probe)}
              </span>
              <span>
                Nächste Aufführung: {formatDate(prod.naechste_auffuehrung)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
