'use client'

import { useState } from 'react'
import type { SachleistungMitZusagen } from '@/lib/supabase/types'
import { SachleistungCard } from './SachleistungCard'
import { SachleistungZusageForm } from './SachleistungZusageForm'

interface SachleistungenListeProps {
  sachleistungen: SachleistungMitZusagen[]
  /** Mode determines what actions are available */
  mode: 'public' | 'intern' | 'admin'
  /** Title override */
  title?: string
}

/**
 * Reusable sachleistungen list component.
 * Used on both the public mitmach page and internal views.
 */
export function SachleistungenListe({
  sachleistungen,
  mode,
  title = 'Sachspenden',
}: SachleistungenListeProps) {
  const [pledgingId, setPledgingId] = useState<string | null>(null)

  if (sachleistungen.length === 0) return null

  const hasOpenItems = sachleistungen.some((s) => s.offen_anzahl > 0)
  const totalBenötigt = sachleistungen.reduce((sum, s) => sum + s.anzahl, 0)
  const totalZugesagt = sachleistungen.reduce((sum, s) => sum + s.zugesagt_anzahl, 0)

  const pledgingSachleistung = pledgingId
    ? sachleistungen.find((s) => s.id === pledgingId) ?? null
    : null

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
          <p className="text-sm text-neutral-500">
            {totalZugesagt} von {totalBenötigt} Sachspenden zugesagt
          </p>
        </div>
        {hasOpenItems && (
          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
            {totalBenötigt - totalZugesagt} offen
          </span>
        )}
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {sachleistungen.map((sl) => (
          <SachleistungCard
            key={sl.id}
            sachleistung={sl}
            onPledge={mode !== 'admin' ? () => setPledgingId(sl.id) : undefined}
          />
        ))}
      </div>

      {/* Pledge Form Modal */}
      {pledgingSachleistung && (
        <SachleistungZusageForm
          sachleistung={pledgingSachleistung}
          mode={mode === 'intern' ? 'intern' : 'extern'}
          onClose={() => setPledgingId(null)}
        />
      )}
    </div>
  )
}
