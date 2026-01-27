'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createTemplate, updateTemplate, archiveTemplate } from '@/lib/actions/templates'
import type { AuffuehrungTemplate } from '@/lib/supabase/types'

interface TemplateFormProps {
  template?: AuffuehrungTemplate
  mode: 'create' | 'edit'
}

export function TemplateForm({ template, mode }: TemplateFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(template?.name || '')
  const [beschreibung, setBeschreibung] = useState(template?.beschreibung || '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const data = {
      name,
      beschreibung: beschreibung || null,
      archiviert: false,
    }

    const result =
      mode === 'create'
        ? await createTemplate(data)
        : await updateTemplate(template!.id, data)

    if (result.success) {
      if (mode === 'create' && 'id' in result && result.id) {
        router.push(`/templates/${result.id}` as never)
      } else {
        router.push('/templates' as never)
      }
      router.refresh()
    } else {
      setError(result.error || 'Ein Fehler ist aufgetreten')
      setLoading(false)
    }
  }

  async function handleArchive() {
    if (!template) return
    if (!confirm(`"${template.name}" wirklich archivieren?`)) return

    setLoading(true)
    const result = await archiveTemplate(template.id)

    if (result.success) {
      router.push('/templates' as never)
      router.refresh()
    } else {
      setError(result.error || 'Ein Fehler ist aufgetreten')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Name *
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z.B. Standard-Aufführung, Matinée"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Beschreibung */}
      <div>
        <label htmlFor="beschreibung" className="block text-sm font-medium text-gray-700 mb-1">
          Beschreibung
        </label>
        <textarea
          id="beschreibung"
          rows={3}
          value={beschreibung}
          onChange={(e) => setBeschreibung(e.target.value)}
          placeholder="Kurze Beschreibung der Vorlage..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center pt-4 border-t">
        <div>
          {mode === 'edit' && !template?.archiviert && (
            <button
              type="button"
              onClick={handleArchive}
              disabled={loading}
              className="px-3 py-1.5 text-red-600 hover:text-red-800 text-sm disabled:opacity-50"
            >
              Archivieren
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors text-sm"
        >
          {loading ? 'Speichern...' : 'Speichern'}
        </button>
      </div>
    </form>
  )
}
