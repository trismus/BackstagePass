'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type {
  Produktion,
  ProduktionInsert,
  ProduktionStatus,
  Stueck,
  Person,
} from '@/lib/supabase/types'
import { PRODUKTION_STATUS_LABELS } from '@/lib/supabase/types'
import { createProduktion, updateProduktion } from '@/lib/actions/produktionen'

interface ProduktionFormProps {
  mode: 'create' | 'edit'
  produktion?: Produktion
  stuecke?: Stueck[]
  personen?: Person[]
}

const statusOptions: { value: ProduktionStatus; label: string }[] =
  Object.entries(PRODUKTION_STATUS_LABELS).map(([value, label]) => ({
    value: value as ProduktionStatus,
    label,
  }))

export function ProduktionForm({
  mode,
  produktion,
  stuecke = [],
  personen = [],
}: ProduktionFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentYear = new Date().getFullYear()

  const [formData, setFormData] = useState<ProduktionInsert>({
    titel: produktion?.titel ?? '',
    beschreibung: produktion?.beschreibung ?? null,
    stueck_id: produktion?.stueck_id ?? null,
    status: produktion?.status ?? 'draft',
    saison: produktion?.saison ?? `${currentYear}`,
    proben_start: produktion?.proben_start ?? null,
    premiere: produktion?.premiere ?? null,
    derniere: produktion?.derniere ?? null,
    produktionsleitung_id: produktion?.produktionsleitung_id ?? null,
  })

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
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
        const result = await createProduktion(formData)
        if (result.success && result.id) {
          router.push(`/produktionen/${result.id}`)
        } else {
          setError(result.error || 'Fehler beim Erstellen')
        }
      } else if (produktion) {
        const result = await updateProduktion(produktion.id, formData)
        if (result.success) {
          router.push(`/produktionen/${produktion.id}`)
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
        <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-error-700">
          {error}
        </div>
      )}

      {/* Titel */}
      <div>
        <label
          htmlFor="titel"
          className="block text-sm font-medium text-gray-700"
        >
          Titel *
        </label>
        <input
          type="text"
          id="titel"
          name="titel"
          required
          value={formData.titel}
          onChange={handleChange}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
          placeholder="z.B. Sommernachtstraum 2026"
        />
      </div>

      {/* Stück und Saison */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Stück */}
        <div>
          <label
            htmlFor="stueck_id"
            className="block text-sm font-medium text-gray-700"
          >
            Stück (optional)
          </label>
          <select
            id="stueck_id"
            name="stueck_id"
            value={formData.stueck_id ?? ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
          >
            <option value="">– Kein Stück –</option>
            {stuecke.map((s) => (
              <option key={s.id} value={s.id}>
                {s.titel}
              </option>
            ))}
          </select>
        </div>

        {/* Saison */}
        <div>
          <label
            htmlFor="saison"
            className="block text-sm font-medium text-gray-700"
          >
            Saison *
          </label>
          <input
            type="text"
            id="saison"
            name="saison"
            required
            value={formData.saison}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
            placeholder="z.B. 2026 oder 2026/2027"
          />
        </div>
      </div>

      {/* Status und Produktionsleitung */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Status */}
        <div>
          <label
            htmlFor="status"
            className="block text-sm font-medium text-gray-700"
          >
            Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
          >
            {statusOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Produktionsleitung */}
        <div>
          <label
            htmlFor="produktionsleitung_id"
            className="block text-sm font-medium text-gray-700"
          >
            Produktionsleitung
          </label>
          <select
            id="produktionsleitung_id"
            name="produktionsleitung_id"
            value={formData.produktionsleitung_id ?? ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
          >
            <option value="">– Nicht zugewiesen –</option>
            {personen.map((p) => (
              <option key={p.id} value={p.id}>
                {p.vorname} {p.nachname}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Daten */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label
            htmlFor="proben_start"
            className="block text-sm font-medium text-gray-700"
          >
            Probenstart
          </label>
          <input
            type="date"
            id="proben_start"
            name="proben_start"
            value={formData.proben_start ?? ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label
            htmlFor="premiere"
            className="block text-sm font-medium text-gray-700"
          >
            Premiere
          </label>
          <input
            type="date"
            id="premiere"
            name="premiere"
            value={formData.premiere ?? ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <div>
          <label
            htmlFor="derniere"
            className="block text-sm font-medium text-gray-700"
          >
            Dernière
          </label>
          <input
            type="date"
            id="derniere"
            name="derniere"
            value={formData.derniere ?? ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Beschreibung */}
      <div>
        <label
          htmlFor="beschreibung"
          className="block text-sm font-medium text-gray-700"
        >
          Beschreibung
        </label>
        <textarea
          id="beschreibung"
          name="beschreibung"
          rows={4}
          value={formData.beschreibung ?? ''}
          onChange={handleChange}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
          placeholder="Kurze Beschreibung der Produktion..."
        />
      </div>

      {/* Submit */}
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
          className="rounded-lg bg-primary-600 px-6 py-2 font-medium text-white transition-colors hover:bg-primary-700 disabled:bg-gray-400"
        >
          {isSubmitting
            ? 'Wird gespeichert...'
            : mode === 'create'
              ? 'Produktion erstellen'
              : 'Änderungen speichern'}
        </button>
      </div>
    </form>
  )
}
