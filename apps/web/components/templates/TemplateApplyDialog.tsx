'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { applyTemplate } from '@/lib/actions/templates'
import type { AuffuehrungTemplate } from '@/lib/supabase/types'

interface TemplateApplyDialogProps {
  veranstaltungId: string
  startzeit: string
  templates: AuffuehrungTemplate[]
}

export function TemplateApplyDialog({
  veranstaltungId,
  startzeit,
  templates,
}: TemplateApplyDialogProps) {
  const router = useRouter()
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleApply() {
    if (!selectedTemplateId) return
    setLoading(true)
    setError(null)

    const result = await applyTemplate(
      selectedTemplateId,
      veranstaltungId,
      startzeit
    )

    if (result.success) {
      setSelectedTemplateId('')
      router.refresh()
    } else {
      setError(result.error || 'Ein Fehler ist aufgetreten')
    }
    setLoading(false)
  }

  if (templates.length === 0) {
    return null
  }

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
      <h4 className="mb-2 font-medium text-blue-900">Vorlage anwenden</h4>
      <p className="mb-3 text-sm text-blue-700">
        Wende eine Vorlage an, um Zeitblöcke, Schichten und Ressourcen
        automatisch zu erstellen.
      </p>

      {error && (
        <div className="mb-3 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <select
          value={selectedTemplateId}
          onChange={(e) => setSelectedTemplateId(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="">Vorlage auswählen...</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
              {t.beschreibung && ` - ${t.beschreibung}`}
            </option>
          ))}
        </select>
        <button
          onClick={handleApply}
          disabled={loading || !selectedTemplateId}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:bg-blue-400"
        >
          {loading ? 'Wird angewendet...' : 'Anwenden'}
        </button>
      </div>
    </div>
  )
}
