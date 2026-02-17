'use client'

import type { BesetzungsVorschlag } from '@/lib/actions/produktions-besetzungen'
import type { VerfuegbarkeitStatus } from '@/lib/supabase/types'

interface BesetzungsVorschlagProps {
  vorschlaege: BesetzungsVorschlag[]
  onSelect: (personId: string) => void
  isLoading?: boolean
}

const VERFUEGBARKEIT_DOT: Record<VerfuegbarkeitStatus, string> = {
  verfuegbar: 'bg-green-500',
  eingeschraenkt: 'bg-amber-500',
  nicht_verfuegbar: 'bg-red-500',
}

const VERFUEGBARKEIT_LABEL: Record<VerfuegbarkeitStatus, string> = {
  verfuegbar: 'Verfügbar',
  eingeschraenkt: 'Eingeschränkt',
  nicht_verfuegbar: 'Nicht verfügbar',
}

export function BesetzungsVorschlagList({
  vorschlaege,
  onSelect,
  isLoading = false,
}: BesetzungsVorschlagProps) {
  if (isLoading) {
    return (
      <div className="py-3 text-center text-sm text-gray-500">
        Vorschläge werden geladen...
      </div>
    )
  }

  if (vorschlaege.length === 0) {
    return (
      <div className="py-3 text-center text-sm text-gray-500">
        Keine Vorschläge verfügbar.
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-gray-500">Vorschläge</p>
      <div className="max-h-48 space-y-1 overflow-y-auto">
        {vorschlaege.slice(0, 10).map((v) => (
          <div
            key={v.person.id}
            className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
              v.hatKonflikt || v.verfuegbarkeit === 'nicht_verfuegbar'
                ? 'bg-warning-50 opacity-70'
                : 'bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-block h-2 w-2 shrink-0 rounded-full ${VERFUEGBARKEIT_DOT[v.verfuegbarkeit]}`}
                  title={VERFUEGBARKEIT_LABEL[v.verfuegbarkeit]}
                />
                <span className="font-medium text-gray-900">
                  {v.person.vorname} {v.person.nachname}
                </span>
                {v.hatKonflikt && (
                  <span className="text-xs text-warning-600">
                    (bereits: {v.konfliktRolle})
                  </span>
                )}
              </div>
              {v.verfuegbarkeit !== 'verfuegbar' && v.verfuegbarkeitDetails && (
                <p className="ml-4 text-xs text-amber-600">
                  {VERFUEGBARKEIT_LABEL[v.verfuegbarkeit]}: {v.verfuegbarkeitDetails}
                </p>
              )}
              {v.matchingSkills.length > 0 && (
                <div className="ml-4 mt-0.5 flex flex-wrap gap-1">
                  {v.matchingSkills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded bg-primary-100 px-1.5 py-0.5 text-xs text-primary-700"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => onSelect(v.person.id)}
              disabled={v.hatKonflikt}
              className="ml-2 shrink-0 rounded px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 disabled:text-gray-400"
            >
              Vormerken
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
