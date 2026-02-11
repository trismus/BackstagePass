'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { anmeldenPublic } from '@/lib/actions/helferliste'
import type {
  HelferEventMitRollen,
  RollenInstanzMitAnmeldungen,
} from '@/lib/supabase/types'

interface PublicEventViewProps {
  event: HelferEventMitRollen
}

export function PublicEventView({ event }: PublicEventViewProps) {
  if (event.rollen.length === 0) {
    return (
      <div className="rounded-lg bg-white p-8 text-center shadow">
        <p className="text-gray-500">
          Derzeit keine öffentlichen Rollen verfügbar.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-900">Verfügbare Rollen</h2>
      {event.rollen.map((rolle) => (
        <PublicRolleCard key={rolle.id} rolle={rolle} />
      ))}
    </div>
  )
}

function PublicRolleCard({ rolle }: { rolle: RollenInstanzMitAnmeldungen }) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isWaitlist, setIsWaitlist] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    telefon: '',
  })

  const rollenName =
    rolle.template?.name || rolle.custom_name || 'Unbekannte Rolle'
  const isFull = rolle.angemeldet_count >= rolle.anzahl_benoetigt
  const spotsLeft = rolle.anzahl_benoetigt - rolle.angemeldet_count

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return null
    return new Date(dateStr).toLocaleString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const result = await anmeldenPublic(rolle.id, formData)
    if (!result.success) {
      setError(result.error || 'Fehler bei der Anmeldung')
      setIsSubmitting(false)
      return
    }

    setSuccess(true)
    setIsWaitlist(result.isWaitlist ?? false)
    setIsSubmitting(false)
    router.refresh()
  }

  if (success) {
    return (
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success-100">
            <svg
              className="h-6 w-6 text-success-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="font-medium text-gray-900">
            {isWaitlist ? 'Auf Warteliste gesetzt!' : 'Anmeldung erfolgreich!'}
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            {isWaitlist
              ? `Du stehst auf der Warteliste für "${rollenName}". Wir melden uns, sobald ein Platz frei wird.`
              : `Du hast dich für "${rollenName}" angemeldet.`}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{rollenName}</h3>
          {(rolle.zeitblock_start || rolle.zeitblock_end) && (
            <p className="mt-1 text-sm text-gray-500">
              {formatDateTime(rolle.zeitblock_start)}
              {rolle.zeitblock_end &&
                ` - ${formatDateTime(rolle.zeitblock_end)}`}
            </p>
          )}
        </div>
        <div className="text-right">
          <span
            className={`text-sm font-medium ${isFull ? 'text-warning-600' : 'text-success-600'}`}
          >
            {isFull ? 'Voll (Warteliste möglich)' : `${spotsLeft} Plätze frei`}
          </span>
        </div>
      </div>

      {/* Already registered */}
      {rolle.anmeldungen.length > 0 && (
        <div className="mt-4 border-t border-gray-100 pt-4">
          <p className="text-sm text-gray-500">
            {rolle.anmeldungen.length} Anmeldung
            {rolle.anmeldungen.length > 1 ? 'en' : ''}
          </p>
        </div>
      )}

      {/* Registration Form */}
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="mt-4 w-full rounded-lg bg-primary-600 px-4 py-2 font-medium text-white transition-colors hover:bg-primary-700"
        >
          {isFull ? 'Auf Warteliste setzen' : 'Jetzt anmelden'}
        </button>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-4 space-y-4 border-t border-gray-100 pt-4"
        >
          {error && (
            <div className="border-error-200 rounded border bg-error-50 px-3 py-2 text-sm text-error-700">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor={`name-${rolle.id}`}
              className="block text-sm font-medium text-gray-700"
            >
              Name *
            </label>
            <input
              type="text"
              id={`name-${rolle.id}`}
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
              placeholder="Dein Name"
            />
          </div>

          <div>
            <label
              htmlFor={`email-${rolle.id}`}
              className="block text-sm font-medium text-gray-700"
            >
              E-Mail (optional)
            </label>
            <input
              type="email"
              id={`email-${rolle.id}`}
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
              placeholder="name@beispiel.ch"
            />
          </div>

          <div>
            <label
              htmlFor={`telefon-${rolle.id}`}
              className="block text-sm font-medium text-gray-700"
            >
              Telefon (optional)
            </label>
            <input
              type="tel"
              id={`telefon-${rolle.id}`}
              value={formData.telefon}
              onChange={(e) =>
                setFormData({ ...formData, telefon: e.target.value })
              }
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
              placeholder="+41 79 123 45 67"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-primary-600 px-4 py-2 font-medium text-white transition-colors hover:bg-primary-700 disabled:opacity-50"
            >
              {isSubmitting
                ? 'Anmelden...'
                : isFull
                  ? 'Auf Warteliste'
                  : 'Anmelden'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
