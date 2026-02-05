'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Route } from 'next'
import type { Person, MeetingTyp } from '@/lib/supabase/types'
import { createMeeting } from '@/lib/actions/meetings'
import { MEETING_TYP_LABELS } from '@/lib/supabase/types'

interface MeetingFormProps {
  personen: Person[]
  defaultValues?: {
    titel?: string
    beschreibung?: string
    datum?: string
    startzeit?: string
    endzeit?: string
    ort?: string
    meeting_typ?: MeetingTyp
    leiter_id?: string
    protokollant_id?: string
  }
}

export function MeetingForm({ personen, defaultValues }: MeetingFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    titel: defaultValues?.titel || '',
    beschreibung: defaultValues?.beschreibung || '',
    datum: defaultValues?.datum || '',
    startzeit: defaultValues?.startzeit || '',
    endzeit: defaultValues?.endzeit || '',
    ort: defaultValues?.ort || '',
    meeting_typ: defaultValues?.meeting_typ || 'team' as MeetingTyp,
    leiter_id: defaultValues?.leiter_id || '',
    protokollant_id: defaultValues?.protokollant_id || '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const result = await createMeeting(
      {
        titel: formData.titel,
        beschreibung: formData.beschreibung || null,
        datum: formData.datum,
        startzeit: formData.startzeit || null,
        endzeit: formData.endzeit || null,
        ort: formData.ort || null,
        max_teilnehmer: null,
        warteliste_aktiv: false,
        organisator_id: null,
        status: 'geplant',
      },
      {
        meeting_typ: formData.meeting_typ,
        leiter_id: formData.leiter_id || null,
        protokollant_id: formData.protokollant_id || null,
        protokoll: null,
        protokoll_status: 'entwurf',
        wiederkehrend_template_id: null,
      }
    )

    if (result.success && result.veranstaltungId) {
      router.push(`/meetings/${result.veranstaltungId}` as Route)
    } else {
      setError(result.error || 'Fehler beim Erstellen des Meetings')
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-error-200 bg-error-50 p-4 text-error-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Meeting Typ */}
        <div>
          <label htmlFor="meeting_typ" className="block text-sm font-medium text-gray-700">
            Meeting-Typ *
          </label>
          <select
            id="meeting_typ"
            value={formData.meeting_typ}
            onChange={(e) => setFormData({ ...formData, meeting_typ: e.target.value as MeetingTyp })}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            required
          >
            {Object.entries(MEETING_TYP_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Titel */}
        <div>
          <label htmlFor="titel" className="block text-sm font-medium text-gray-700">
            Titel *
          </label>
          <input
            type="text"
            id="titel"
            value={formData.titel}
            onChange={(e) => setFormData({ ...formData, titel: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            required
          />
        </div>

        {/* Datum */}
        <div>
          <label htmlFor="datum" className="block text-sm font-medium text-gray-700">
            Datum *
          </label>
          <input
            type="date"
            id="datum"
            value={formData.datum}
            onChange={(e) => setFormData({ ...formData, datum: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            required
          />
        </div>

        {/* Startzeit */}
        <div>
          <label htmlFor="startzeit" className="block text-sm font-medium text-gray-700">
            Startzeit
          </label>
          <input
            type="time"
            id="startzeit"
            value={formData.startzeit}
            onChange={(e) => setFormData({ ...formData, startzeit: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        {/* Endzeit */}
        <div>
          <label htmlFor="endzeit" className="block text-sm font-medium text-gray-700">
            Endzeit
          </label>
          <input
            type="time"
            id="endzeit"
            value={formData.endzeit}
            onChange={(e) => setFormData({ ...formData, endzeit: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        {/* Ort */}
        <div>
          <label htmlFor="ort" className="block text-sm font-medium text-gray-700">
            Ort
          </label>
          <input
            type="text"
            id="ort"
            value={formData.ort}
            onChange={(e) => setFormData({ ...formData, ort: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        {/* Leitung */}
        <div>
          <label htmlFor="leiter_id" className="block text-sm font-medium text-gray-700">
            Leitung
          </label>
          <select
            id="leiter_id"
            value={formData.leiter_id}
            onChange={(e) => setFormData({ ...formData, leiter_id: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">Keine Auswahl</option>
            {personen.map((person) => (
              <option key={person.id} value={person.id}>
                {person.vorname} {person.nachname}
              </option>
            ))}
          </select>
        </div>

        {/* Protokollant */}
        <div>
          <label htmlFor="protokollant_id" className="block text-sm font-medium text-gray-700">
            Protokollant
          </label>
          <select
            id="protokollant_id"
            value={formData.protokollant_id}
            onChange={(e) => setFormData({ ...formData, protokollant_id: e.target.value })}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">Keine Auswahl</option>
            {personen.map((person) => (
              <option key={person.id} value={person.id}>
                {person.vorname} {person.nachname}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Beschreibung */}
      <div>
        <label htmlFor="beschreibung" className="block text-sm font-medium text-gray-700">
          Beschreibung
        </label>
        <textarea
          id="beschreibung"
          value={formData.beschreibung}
          onChange={(e) => setFormData({ ...formData, beschreibung: e.target.value })}
          rows={3}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          Abbrechen
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {isSubmitting ? 'Erstellen...' : 'Meeting erstellen'}
        </button>
      </div>
    </form>
  )
}
