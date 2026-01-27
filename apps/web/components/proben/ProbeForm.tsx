'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Route } from 'next'
import type { Probe, ProbeInsert, ProbeStatus, Szene } from '@/lib/supabase/types'
import { createProbe, updateProbe, updateProbeSzenen } from '@/lib/actions/proben'

interface ProbeFormProps {
  mode: 'create' | 'edit'
  stueckId: string
  szenen: Szene[]
  probe?: Probe
  selectedSzenenIds?: string[]
}

const statusOptions: { value: ProbeStatus; label: string }[] = [
  { value: 'geplant', label: 'Geplant' },
  { value: 'bestaetigt', label: 'Bestätigt' },
  { value: 'verschoben', label: 'Verschoben' },
  { value: 'abgesagt', label: 'Abgesagt' },
  { value: 'abgeschlossen', label: 'Abgeschlossen' },
]

export function ProbeForm({ mode, stueckId, szenen, probe, selectedSzenenIds = [] }: ProbeFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<ProbeInsert>({
    stueck_id: stueckId,
    titel: probe?.titel ?? '',
    beschreibung: probe?.beschreibung ?? null,
    datum: probe?.datum ?? '',
    startzeit: probe?.startzeit ?? null,
    endzeit: probe?.endzeit ?? null,
    ort: probe?.ort ?? null,
    status: probe?.status ?? 'geplant',
    notizen: probe?.notizen ?? null,
  })

  const [szenenIds, setSzenenIds] = useState<string[]>(selectedSzenenIds)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value === '' ? null : value,
    }))
  }

  const toggleSzene = (szeneId: string) => {
    setSzenenIds((prev) =>
      prev.includes(szeneId)
        ? prev.filter((id) => id !== szeneId)
        : [...prev, szeneId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.datum) {
      setError('Bitte Datum auswählen')
      return
    }
    setIsSubmitting(true)
    setError(null)

    try {
      if (mode === 'create') {
        const result = await createProbe(formData)
        if (result.success && result.id) {
          // Szenen hinzufügen
          if (szenenIds.length > 0) {
            await updateProbeSzenen(result.id, szenenIds)
          }
          router.push(`/proben/${result.id}` as Route)
        } else {
          setError(result.error || 'Fehler beim Erstellen')
        }
      } else if (probe) {
        const result = await updateProbe(probe.id, formData)
        if (result.success) {
          // Szenen aktualisieren
          await updateProbeSzenen(probe.id, szenenIds)
          router.push(`/proben/${probe.id}` as Route)
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
          placeholder="z.B. Probe Akt 1"
        />
      </div>

      {/* Datum und Zeit */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label htmlFor="datum" className="block text-sm font-medium text-gray-700">
            Datum *
          </label>
          <input
            type="date"
            id="datum"
            name="datum"
            required
            value={formData.datum}
            onChange={handleChange}
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div>
          <label htmlFor="startzeit" className="block text-sm font-medium text-gray-700">
            Startzeit
          </label>
          <input
            type="time"
            id="startzeit"
            name="startzeit"
            value={formData.startzeit ?? ''}
            onChange={handleChange}
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div>
          <label htmlFor="endzeit" className="block text-sm font-medium text-gray-700">
            Endzeit
          </label>
          <input
            type="time"
            id="endzeit"
            name="endzeit"
            value={formData.endzeit ?? ''}
            onChange={handleChange}
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Ort und Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="ort" className="block text-sm font-medium text-gray-700">
            Ort
          </label>
          <input
            type="text"
            id="ort"
            name="ort"
            value={formData.ort ?? ''}
            onChange={handleChange}
            className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="z.B. Bühne Gemeindesaal"
          />
        </div>
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
      </div>

      {/* Szenen auswählen */}
      {szenen.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Zu probende Szenen
          </label>
          <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
            {szenen.map((szene) => (
              <label key={szene.id} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={szenenIds.includes(szene.id)}
                  onChange={() => toggleSzene(szene.id)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                  {szene.nummer}
                </span>
                <span className="text-sm text-gray-900">{szene.titel}</span>
                {szene.dauer_minuten && (
                  <span className="text-xs text-gray-500">({szene.dauer_minuten} Min.)</span>
                )}
              </label>
            ))}
          </div>
          {szenenIds.length > 0 && (
            <p className="text-sm text-gray-500 mt-2">
              {szenenIds.length} Szene{szenenIds.length !== 1 && 'n'} ausgewählt
            </p>
          )}
        </div>
      )}

      {/* Beschreibung */}
      <div>
        <label htmlFor="beschreibung" className="block text-sm font-medium text-gray-700">
          Beschreibung
        </label>
        <textarea
          id="beschreibung"
          name="beschreibung"
          rows={3}
          value={formData.beschreibung ?? ''}
          onChange={handleChange}
          className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="Zusätzliche Informationen zur Probe..."
        />
      </div>

      {/* Notizen */}
      <div>
        <label htmlFor="notizen" className="block text-sm font-medium text-gray-700">
          Interne Notizen
        </label>
        <textarea
          id="notizen"
          name="notizen"
          rows={2}
          value={formData.notizen ?? ''}
          onChange={handleChange}
          className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="Interne Notizen (nur für Regie sichtbar)..."
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
              ? 'Probe erstellen'
              : 'Änderungen speichern'}
        </button>
      </div>
    </form>
  )
}
