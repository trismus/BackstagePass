'use client'

import type { AuffuehrungTemplate } from '@/lib/supabase/types'

interface TemplateApplySelectorProps {
  templates: AuffuehrungTemplate[]
  mode: 'create'
}

export function TemplateApplySelector({
  templates,
}: TemplateApplySelectorProps) {
  if (templates.length === 0) {
    return null
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
      <h4 className="mb-2 font-medium text-gray-900">Tipp: Vorlagen nutzen</h4>
      <p className="text-sm text-gray-600">
        Nach dem Erstellen der Aufführung kannst du eine Vorlage anwenden, um
        Zeitblöcke, Schichten und Ressourcen automatisch zu erstellen.
        Verfügbare Vorlagen:
      </p>
      <ul className="mt-2 list-inside list-disc text-sm text-gray-600">
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
