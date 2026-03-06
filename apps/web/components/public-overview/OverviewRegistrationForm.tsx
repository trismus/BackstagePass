'use client'

import { useState } from 'react'
import { registerForMultipleShifts } from '@/lib/actions/public-overview'
import type { MultiRegistrationResult } from '@/lib/actions/public-overview'
import type { PublicOverviewData } from '@/lib/actions/public-overview'
import {
  externeHelferRegistrierungFormSchema,
  type ExterneHelferRegistrierungFormWithPrivacy,
} from '@/lib/validations/externe-helfer'

interface OverviewRegistrationFormProps {
  selectedRolleIds: string[]
  data: PublicOverviewData
  onBack: () => void
  onSuccess: (results: MultiRegistrationResult) => void
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('de-CH', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function OverviewRegistrationForm({
  selectedRolleIds,
  data,
  onBack,
  onSuccess,
}: OverviewRegistrationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] =
    useState<ExterneHelferRegistrierungFormWithPrivacy>({
      email: '',
      vorname: '',
      nachname: '',
      telefon: '',
      datenschutz: false,
    })

  // Build summary of selected roles grouped by event
  const selectedSummary = data.events
    .map((eventEntry) => {
      const roles = eventEntry.rollen
        .filter((r) => selectedRolleIds.includes(r.id))
        .map((r) => ({
          id: r.id,
          name: r.template?.name || r.custom_name || 'Unbekannt',
          zeitblock:
            r.zeitblock_start && r.zeitblock_end
              ? `${formatTime(r.zeitblock_start)} – ${formatTime(r.zeitblock_end)}`
              : null,
        }))
      if (!roles.length) return null
      return { event: eventEntry, roles }
    })
    .filter(Boolean) as Array<{
    event: PublicOverviewData['events'][number]
    roles: Array<{
      id: string
      name: string
      zeitblock: string | null
    }>
  }>

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    const parseResult = externeHelferRegistrierungFormSchema.safeParse(formData)
    if (!parseResult.success) {
      const errors: Record<string, string> = {}
      for (const issue of parseResult.error.issues) {
        const field = issue.path[0] as string
        if (!errors[field]) {
          errors[field] = issue.message
        }
      }
      setFieldErrors(errors)
      return
    }

    setIsSubmitting(true)

    const result = await registerForMultipleShifts(selectedRolleIds, {
      email: formData.email,
      vorname: formData.vorname,
      nachname: formData.nachname,
      telefon: formData.telefon || undefined,
      datenschutz: formData.datenschutz,
    })

    if (!result.success && result.error) {
      setError(result.error)
      if (result.fieldErrors) setFieldErrors(result.fieldErrors)
      setIsSubmitting(false)
      return
    }

    onSuccess(result)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-CH', {
      weekday: 'short',
      day: '2-digit',
      month: 'long',
    })
  }

  return (
    <div className="space-y-6">
      {/* Summary of selected roles */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">
              Ausgewählte Rollen ({selectedRolleIds.length})
            </h2>
            <button
              type="button"
              onClick={onBack}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              Ändern
            </button>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {selectedSummary.map(({ event: eventEntry, roles }) => (
            <div key={eventEntry.event.id} className="px-5 py-3">
              <p className="text-sm font-medium text-gray-900">
                {eventEntry.event.name}{' '}
                <span className="font-normal text-gray-500">
                  ({formatDate(eventEntry.event.datum_start)})
                </span>
              </p>
              <ul className="mt-1 space-y-0.5">
                {roles.map((r) => (
                  <li key={r.id} className="text-sm text-gray-600">
                    {r.name}{' '}
                    {r.zeitblock && (
                      <span className="text-gray-400">
                        &middot; {r.zeitblock}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Registration Form */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-semibold text-gray-900">Deine Kontaktdaten</h2>
          <p className="mt-1 text-sm text-gray-500">
            Bitte fülle das Formular einmal aus — die Anmeldung gilt für alle
            ausgewählten Rollen.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          {error && (
            <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Vorname */}
            <div>
              <label
                htmlFor="overview-vorname"
                className="block text-sm font-medium text-gray-700"
              >
                Vorname *
              </label>
              <input
                type="text"
                id="overview-vorname"
                value={formData.vorname}
                onChange={(e) =>
                  setFormData({ ...formData, vorname: e.target.value })
                }
                className={`mt-1 block w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
                  fieldErrors.vorname
                    ? 'border-error-300 focus:border-error-500'
                    : 'border-gray-300 focus:border-primary-500'
                }`}
                placeholder="Max"
              />
              {fieldErrors.vorname && (
                <p className="mt-1 text-sm text-error-600">
                  {fieldErrors.vorname}
                </p>
              )}
            </div>

            {/* Nachname */}
            <div>
              <label
                htmlFor="overview-nachname"
                className="block text-sm font-medium text-gray-700"
              >
                Nachname *
              </label>
              <input
                type="text"
                id="overview-nachname"
                value={formData.nachname}
                onChange={(e) =>
                  setFormData({ ...formData, nachname: e.target.value })
                }
                className={`mt-1 block w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
                  fieldErrors.nachname
                    ? 'border-error-300 focus:border-error-500'
                    : 'border-gray-300 focus:border-primary-500'
                }`}
                placeholder="Muster"
              />
              {fieldErrors.nachname && (
                <p className="mt-1 text-sm text-error-600">
                  {fieldErrors.nachname}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="overview-email"
                className="block text-sm font-medium text-gray-700"
              >
                E-Mail *
              </label>
              <input
                type="email"
                id="overview-email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className={`mt-1 block w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-primary-500 ${
                  fieldErrors.email
                    ? 'border-error-300 focus:border-error-500'
                    : 'border-gray-300 focus:border-primary-500'
                }`}
                placeholder="max.muster@beispiel.ch"
              />
              {fieldErrors.email && (
                <p className="mt-1 text-sm text-error-600">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Telefon */}
            <div>
              <label
                htmlFor="overview-telefon"
                className="block text-sm font-medium text-gray-700"
              >
                Telefon <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="tel"
                id="overview-telefon"
                value={formData.telefon}
                onChange={(e) =>
                  setFormData({ ...formData, telefon: e.target.value })
                }
                className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                placeholder="+41 79 123 45 67"
              />
            </div>

            {/* Datenschutz */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="overview-datenschutz"
                checked={formData.datenschutz}
                onChange={(e) =>
                  setFormData({ ...formData, datenschutz: e.target.checked })
                }
                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label
                htmlFor="overview-datenschutz"
                className="text-sm text-gray-600"
              >
                Ich akzeptiere die{' '}
                <a
                  href="/datenschutz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline"
                >
                  Datenschutzerklärung
                </a>{' '}
                und stimme der Verarbeitung meiner Daten zu. *
              </label>
            </div>
            {fieldErrors.datenschutz && (
              <p className="text-sm text-error-600">
                {fieldErrors.datenschutz}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Zurück
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting
                ? 'Wird angemeldet...'
                : `Verbindlich anmelden (${selectedRolleIds.length})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
