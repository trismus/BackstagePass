'use client'

import type { SachleistungMitZusagen } from '@/lib/supabase/types'
import { SachleistungenListe } from '@/components/sachleistungen'

interface PublicSachleistungenSectionProps {
  sachleistungen: SachleistungMitZusagen[]
  veranstaltungTitel: string
}

/**
 * Sachleistungen block for the public mitmach page.
 * Shows available in-kind contributions that helpers can pledge.
 */
export function PublicSachleistungenSection({
  sachleistungen,
  veranstaltungTitel: _veranstaltungTitel,
}: PublicSachleistungenSectionProps) {
  if (sachleistungen.length === 0) return null

  const hasOpenItems = sachleistungen.some((s) => s.offen_anzahl > 0)

  return (
    <div className="mt-4">
      <div className="mb-3 flex items-center gap-2">
        <svg
          className="h-5 w-5 text-primary-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
        <h3 className="text-base font-semibold text-gray-900">
          Sachspenden
        </h3>
        {hasOpenItems && (
          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
            Hilfe gesucht
          </span>
        )}
      </div>
      <SachleistungenListe
        sachleistungen={sachleistungen}
        mode="public"
        title=""
      />
    </div>
  )
}
