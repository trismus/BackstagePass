'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { registerExternalHelper } from '@/lib/actions/external-registration'
import {
  externeHelferRegistrierungFormSchema,
  type ExterneHelferRegistrierungFormWithPrivacy,
} from '@/lib/validations/externe-helfer'

interface ExternalRegistrationFormProps {
  token: string
  schichtId: string
  schichtName: string
  zeitInfo?: string
  onClose: () => void
  onSuccess: () => void
}

export function ExternalRegistrationForm({
  token,
  schichtId,
  schichtName,
  zeitInfo,
  onClose,
  onSuccess,
}: ExternalRegistrationFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [formData, setFormData] = useState<ExterneHelferRegistrierungFormWithPrivacy>({
    email: '',
    vorname: '',
    nachname: '',
    telefon: '',
    datenschutz: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    // Validate form
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

    const result = await registerExternalHelper(token, schichtId, {
      email: formData.email,
      vorname: formData.vorname,
      nachname: formData.nachname,
      telefon: formData.telefon || undefined,
    })

    if (!result.success) {
      setError(result.error || 'Fehler bei der Anmeldung')
      setIsSubmitting(false)
      return
    }

    router.refresh()
    onSuccess()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
        {/* Header */}
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Anmeldung: {schichtName}
          </h2>
          {zeitInfo && <p className="text-sm text-gray-500">{zeitInfo}</p>}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {/* Vorname */}
            <div>
              <label
                htmlFor="vorname"
                className="block text-sm font-medium text-gray-700"
              >
                Vorname *
              </label>
              <input
                type="text"
                id="vorname"
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
                <p className="mt-1 text-sm text-error-600">{fieldErrors.vorname}</p>
              )}
            </div>

            {/* Nachname */}
            <div>
              <label
                htmlFor="nachname"
                className="block text-sm font-medium text-gray-700"
              >
                Nachname *
              </label>
              <input
                type="text"
                id="nachname"
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
                <p className="mt-1 text-sm text-error-600">{fieldErrors.nachname}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                E-Mail *
              </label>
              <input
                type="email"
                id="email"
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
                <p className="mt-1 text-sm text-error-600">{fieldErrors.email}</p>
              )}
            </div>

            {/* Telefon */}
            <div>
              <label
                htmlFor="telefon"
                className="block text-sm font-medium text-gray-700"
              >
                Telefon <span className="text-gray-400">(optional)</span>
              </label>
              <input
                type="tel"
                id="telefon"
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
                id="datenschutz"
                checked={formData.datenschutz}
                onChange={(e) =>
                  setFormData({ ...formData, datenschutz: e.target.checked })
                }
                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="datenschutz" className="text-sm text-gray-600">
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
              <p className="text-sm text-error-600">{fieldErrors.datenschutz}</p>
            )}
          </div>

          {/* Actions */}
          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? 'Wird angemeldet...' : 'Verbindlich anmelden'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
