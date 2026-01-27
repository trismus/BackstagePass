'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Stueck, StueckInsert, StueckStatus } from '@/lib/supabase/types'
import { createStueck, updateStueck } from '@/lib/actions/stuecke'

interface StueckFormProps {
  mode: 'create' | 'edit'
  stueck?: Stueck
}

const statusOptions: { value: StueckStatus; label: string }[] = [
  { value: 'in_planung', label: 'In Planung' },
  { value: 'in_proben', label: 'In Proben' },
  { value: 'aktiv', label: 'Aktiv' },
  { value: 'abgeschlossen', label: 'Abgeschlossen' },
  { value: 'archiviert', label: 'Archiviert' },
]

export function StueckForm({ mode, stueck }: StueckFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<StueckInsert>({
    titel: stueck?.titel ?? '',
    beschreibung: stueck?.beschreibung ?? null,
    autor: stueck?.autor ?? null,
    status: stueck?.status ?? 'in_planung',
    premiere_datum: stueck?.premiere_datum ?? null,
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value === '' ? null : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (mode === 'create') {
        const result = await createStueck(formData)
        if (result.success && result.id) {
          router.push(`/stuecke/${result.id}`)
        } else {
          setError(result.error || 'Fehler beim Erstellen')
        }
      } else if (stueck) {
        const result = await updateStueck(stueck.id, formData)
        if (result.success) {
          router.push(`/stuecke/${stueck.id}`)
        } else {
          setError(result.error || 'Fehler beim Aktualisieren')
        }
      }
    } catch {
      setError('Ein unerwarteter Fehler ist aufgetreten')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-error-50 border border-error-200 text-error-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Titel */}
      <div>
        <label htmlFor="titel" className="block text-sm font-medium text-gray-700">
          Titel *
        </label>
        <input
          type="text"
          id="titel"
          name="titel"
          required
          value={formData.titel}
          onChange={handleChange}
          className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="z.B. Der Besuch der alten Dame"
        />
      </div>

      {/* Autor */}
      <div>
        <label htmlFor="autor" className="block text-sm font-medium text-gray-700">
          Autor
        </label>
        <input
          type="text"
          id="autor"
          name="autor"
          value={formData.autor ?? ''}
          onChange={handleChange}
          className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="z.B. Friedrich Dürrenmatt"
        />
      </div>

      {/* Status und Premiere in einer Zeile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Premiere Datum */}
        <div>
          <label htmlFor="premiere_datum" className="block text-sm font-medium text-gray-700">
            Premiere
          </label>
          <input
            type="date"
            id="premiere_datum"
            name="premiere_datum"
            value={formData.premiere_datum ?? ''}
            onChange={handleChange}
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Beschreibung */}
      <div>
        <label htmlFor="beschreibung" className="block text-sm font-medium text-gray-700">
          Beschreibung
        </label>
        <textarea
          id="beschreibung"
          name="beschreibung"
          rows={4}
          value={formData.beschreibung ?? ''}
          onChange={handleChange}
          className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="Kurze Beschreibung des Stücks..."
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-gray-700 hover:text-gray-900"
        >
          Abbrechen
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-medium rounded-lg transition-colors"
        >
          {isSubmitting
            ? 'Wird gespeichert...'
            : mode === 'create'
              ? 'Stück erstellen'
              : 'Änderungen speichern'}
        </button>
      </div>
    </form>
  )
}
