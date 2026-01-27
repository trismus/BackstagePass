'use client'

import type { AuffuehrungTemplate } from '@/lib/supabase/types'

interface TemplateApplySelectorProps {
  templates: AuffuehrungTemplate[]
  mode: 'create'
}

export function TemplateApplySelector({ templates }: TemplateApplySelectorProps) {
  if (templates.length === 0) {
    return null
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h4 className="font-medium text-gray-900 mb-2">Tipp: Vorlagen nutzen</h4>
      <p className="text-sm text-gray-600">
        Nach dem Erstellen der Aufführung kannst du eine Vorlage anwenden, um Zeitblöcke,
        Schichten und Ressourcen automatisch zu erstellen. Verfügbare Vorlagen:
      </p>
      <ul className="mt-2 text-sm text-gray-600 list-disc list-inside">
        {templates.map((t) => (
          <li key={t.id}>
            <span className="font-medium">{t.name}</span>
            {t.beschreibung && <span> - {t.beschreibung}</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}
