'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createHelferRollenTemplate } from '@/lib/actions/helfer-templates'

export function TemplateForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    beschreibung: '',
    default_anzahl: 1,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const result = await createHelferRollenTemplate(formData)
    if (!result.success) {
      setError(result.error || 'Fehler beim Erstellen')
      setIsSubmitting(false)
      return
    }

    router.push('/helferliste/templates' as never)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="border-error-200 rounded border bg-error-50 px-4 py-3 text-error-700">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700"
        >
          Name *
        </label>
        <input
          type="text"
          id="name"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
          placeholder="z.B. Einlass"
        />
      </div>

      <div>
        <label
          htmlFor="beschreibung"
          className="block text-sm font-medium text-gray-700"
        >
          Beschreibung
        </label>
        <textarea
          id="beschreibung"
          rows={3}
          value={formData.beschreibung}
          onChange={(e) =>
            setFormData({ ...formData, beschreibung: e.target.value })
          }
          className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
          placeholder="Was macht diese Rolle?"
        />
      </div>

      <div>
        <label
          htmlFor="default_anzahl"
          className="block text-sm font-medium text-gray-700"
        >
          Standard-Anzahl
        </label>
        <input
          type="number"
          id="default_anzahl"
          min="1"
          value={formData.default_anzahl}
          onChange={(e) =>
            setFormData({
              ...formData,
              default_anzahl: parseInt(e.target.value) || 1,
            })
          }
          className="mt-1 block w-24 rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
        />
        <p className="mt-1 text-sm text-gray-500">
          Wie viele Personen werden normalerweise für diese Rolle benötigt?
        </p>
      </div>

      <div className="flex justify-end gap-3 border-t pt-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Abbrechen
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-primary-600 px-4 py-2 font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Speichern...' : 'Vorlage erstellen'}
        </button>
      </div>
    </form>
  )
}
