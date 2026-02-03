'use client'

import type { BesetzungsVorschlag } from '@/lib/actions/produktions-besetzungen'

interface BesetzungsVorschlagProps {
  vorschlaege: BesetzungsVorschlag[]
  onSelect: (personId: string) => void
  isLoading?: boolean
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
              v.hatKonflikt
                ? 'bg-warning-50 opacity-70'
                : 'bg-gray-50 hover:bg-gray-100'
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">
                  {v.person.vorname} {v.person.nachname}
                </span>
                {v.hatKonflikt && (
                  <span className="text-xs text-warning-600">
                    (bereits: {v.konfliktRolle})
                  </span>
                )}
              </div>
              {v.matchingSkills.length > 0 && (
                <div className="mt-0.5 flex flex-wrap gap-1">
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
