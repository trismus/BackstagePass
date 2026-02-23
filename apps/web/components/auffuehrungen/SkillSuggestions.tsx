'use client'

import { useState, useEffect } from 'react'
import type { SkillSuggestion } from '@/lib/actions/mitglieder-integration'
import { suggestMembersForShift } from '@/lib/actions/mitglieder-integration'

interface SkillSuggestionsProps {
  schichtId: string
  onSelect?: (personId: string) => void
}

const verfuegbarkeitColors: Record<string, string> = {
  verfuegbar: 'bg-green-100 text-green-800',
  eingeschraenkt: 'bg-amber-100 text-amber-800',
  nicht_verfuegbar: 'bg-red-100 text-red-800',
}

const verfuegbarkeitLabels: Record<string, string> = {
  verfuegbar: 'Verfügbar',
  eingeschraenkt: 'Eingeschränkt',
  nicht_verfuegbar: 'Nicht verfügbar',
}

export function SkillSuggestions({ schichtId, onSelect }: SkillSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SkillSuggestion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadSuggestions() {
      setLoading(true)
      const data = await suggestMembersForShift(schichtId)
      setSuggestions(data)
      setLoading(false)
    }
    loadSuggestions()
  }, [schichtId])

  if (loading) {
    return (
      <div className="py-4 text-center text-sm text-gray-500">
        Vorschläge werden geladen...
      </div>
    )
  }

  if (suggestions.length === 0) {
    return (
      <div className="py-4 text-center text-sm text-gray-500">
        Keine passenden Mitglieder gefunden
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold text-gray-700">
        Vorschläge ({suggestions.length})
      </h4>
      <div className="max-h-64 space-y-1 overflow-y-auto">
        {suggestions.map((s) => (
          <div
            key={s.person_id}
            className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
              s.bereits_zugewiesen
                ? 'border-gray-100 bg-gray-50 opacity-50'
                : 'border-gray-200 bg-white hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <div>
                <span className="font-medium text-gray-900">
                  {s.vorname} {s.nachname}
                </span>
                {s.matching_skills.length > 0 && (
                  <div className="mt-0.5 flex flex-wrap gap-1">
                    {s.matching_skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex rounded bg-purple-100 px-1.5 py-0.5 text-xs font-medium text-purple-700"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                  verfuegbarkeitColors[s.verfuegbarkeit] || ''
                }`}
              >
                {verfuegbarkeitLabels[s.verfuegbarkeit] || s.verfuegbarkeit}
              </span>
              {!s.bereits_zugewiesen && onSelect && (
                <button
                  onClick={() => onSelect(s.person_id)}
                  className="rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700"
                >
                  Zuweisen
                </button>
              )}
              {s.bereits_zugewiesen && (
                <span className="text-xs text-gray-400">Bereits zugewiesen</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
