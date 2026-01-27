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

    const result = await applyTemplate(selectedTemplateId, veranstaltungId, startzeit)

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
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h4 className="font-medium text-blue-900 mb-2">Vorlage anwenden</h4>
      <p className="text-sm text-blue-700 mb-3">
        Wende eine Vorlage an, um Zeitblöcke, Schichten und Ressourcen automatisch zu erstellen.
      </p>

      {error && (
        <div className="mb-3 p-2 bg-red-50 border border-red-200 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <select
          value={selectedTemplateId}
          onChange={(e) => setSelectedTemplateId(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
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
          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:bg-blue-400"
        >
          {loading ? 'Wird angewendet...' : 'Anwenden'}
        </button>
      </div>
    </div>
  )
}
