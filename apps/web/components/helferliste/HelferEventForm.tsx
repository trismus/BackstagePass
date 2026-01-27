'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createHelferEvent, updateHelferEvent } from '@/lib/actions/helferliste'
import type { HelferEvent, HelferEventTyp } from '@/lib/supabase/types'

interface HelferEventFormProps {
  event?: HelferEvent
}

export function HelferEventForm({ event }: HelferEventFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: event?.name || '',
    typ: (event?.typ || 'auffuehrung') as HelferEventTyp,
    beschreibung: event?.beschreibung || '',
    datum_start: event?.datum_start
      ? new Date(event.datum_start).toISOString().slice(0, 16)
      : '',
    datum_end: event?.datum_end
      ? new Date(event.datum_end).toISOString().slice(0, 16)
      : '',
    ort: event?.ort || '',
    veranstaltung_id: event?.veranstaltung_id || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const data = {
        ...formData,
        datum_start: new Date(formData.datum_start).toISOString(),
        datum_end: new Date(formData.datum_end).toISOString(),
        veranstaltung_id: formData.veranstaltung_id || null,
      }

      if (event) {
        const result = await updateHelferEvent(event.id, data)
        if (!result.success) {
          setError(result.error || 'Fehler beim Aktualisieren')
          return
        }
        router.push(`/helferliste/${event.id}` as never)
      } else {
        const result = await createHelferEvent(data)
        if (!result.success) {
          setError(result.error || 'Fehler beim Erstellen')
          return
        }
        router.push(`/helferliste/${result.id}` as never)
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
          placeholder="z.B. Premiere Sommernachtstraum"
        />
      </div>

      <div>
        <label
          htmlFor="typ"
          className="block text-sm font-medium text-gray-700"
        >
          Typ *
        </label>
        <select
          id="typ"
          required
          value={formData.typ}
          onChange={(e) =>
            setFormData({ ...formData, typ: e.target.value as HelferEventTyp })
          }
          className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
        >
          <option value="auffuehrung">Aufführung</option>
          <option value="helfereinsatz">Helfereinsatz</option>
        </select>
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
          placeholder="Optionale Beschreibung..."
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="datum_start"
            className="block text-sm font-medium text-gray-700"
          >
            Start *
          </label>
          <input
            type="datetime-local"
            id="datum_start"
            required
            value={formData.datum_start}
            onChange={(e) =>
              setFormData({ ...formData, datum_start: e.target.value })
            }
            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div>
          <label
            htmlFor="datum_end"
            className="block text-sm font-medium text-gray-700"
          >
            Ende *
          </label>
          <input
            type="datetime-local"
            id="datum_end"
            required
            value={formData.datum_end}
            onChange={(e) =>
              setFormData({ ...formData, datum_end: e.target.value })
            }
            className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      <div>
        <label
          htmlFor="ort"
          className="block text-sm font-medium text-gray-700"
        >
          Ort
        </label>
        <input
          type="text"
          id="ort"
          value={formData.ort}
          onChange={(e) => setFormData({ ...formData, ort: e.target.value })}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
          placeholder="z.B. Mehrzweckhalle Widen"
        />
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
          {isSubmitting
            ? 'Speichern...'
            : event
              ? 'Aktualisieren'
              : 'Erstellen'}
        </button>
      </div>
    </form>
  )
}
