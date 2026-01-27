'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  createTemplate,
  updateTemplate,
  archiveTemplate,
} from '@/lib/actions/templates'
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
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Name */}
      <div>
        <label
          htmlFor="name"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Name *
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="z.B. Standard-Aufführung, Matinée"
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Beschreibung */}
      <div>
        <label
          htmlFor="beschreibung"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Beschreibung
        </label>
        <textarea
          id="beschreibung"
          rows={3}
          value={beschreibung}
          onChange={(e) => setBeschreibung(e.target.value)}
          placeholder="Kurze Beschreibung der Vorlage..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between border-t pt-4">
        <div>
          {mode === 'edit' && !template?.archiviert && (
            <button
              type="button"
              onClick={handleArchive}
              disabled={loading}
              className="px-3 py-1.5 text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
            >
              Archivieren
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-blue-400"
        >
          {loading ? 'Speichern...' : 'Speichern'}
        </button>
      </div>
    </form>
  )
}
