'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import type { UserRole } from '@/lib/supabase/types'
import { USER_ROLE_LABELS } from '@/lib/supabase/types'
import { updateOwnProfile } from '@/lib/actions/personen'

interface EditableProfileCardProps {
  person: {
    id: string
    vorname: string
    nachname: string
    email?: string | null
    telefon?: string | null
    strasse?: string | null
    plz?: string | null
    ort?: string | null
    geburtstag?: string | null
  } | null
  role?: UserRole
  stundenTotal?: number
  stundenThisYear?: number
  editable?: boolean
}

export function EditableProfileCard({
  person,
  role,
  stundenTotal,
  stundenThisYear,
  editable = true,
}: EditableProfileCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    telefon: person?.telefon || '',
    strasse: person?.strasse || '',
    plz: person?.plz || '',
    ort: person?.ort || '',
  })

  const displayName = person
    ? `${person.vorname} ${person.nachname}`
    : 'Nicht verknüpft'

  const roleLabel = role ? USER_ROLE_LABELS[role] : undefined

  const formatGeburtsdatum = (datum: string) => {
    return new Date(datum).toLocaleDateString('de-CH', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  const handleSave = () => {
    setError(null)
    startTransition(async () => {
      const result = await updateOwnProfile({
        telefon: formData.telefon || null,
        strasse: formData.strasse || null,
        plz: formData.plz || null,
        ort: formData.ort || null,
      })

      if (result.success) {
        setIsEditing(false)
      } else {
        setError(result.error || 'Fehler beim Speichern')
      }
    })
  }

  const handleCancel = () => {
    setFormData({
      telefon: person?.telefon || '',
      strasse: person?.strasse || '',
      plz: person?.plz || '',
      ort: person?.ort || '',
    })
    setIsEditing(false)
    setError(null)
  }

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      {/* Header */}
      <div className="border-b border-neutral-100 bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-4">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white">
            <span className="text-2xl font-bold">
              {person ? person.vorname.charAt(0).toUpperCase() : '?'}
            </span>
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-semibold text-neutral-900">{displayName}</h3>
            {roleLabel && (
              <span className="inline-flex items-center rounded-full bg-white/80 px-2 py-0.5 text-xs font-medium text-neutral-700">
                {roleLabel}
              </span>
            )}
          </div>

          {/* Edit Button */}
          {person && editable && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="rounded-lg p-2 text-neutral-400 hover:bg-white/50 hover:text-neutral-600"
              aria-label="Profil bearbeiten"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="border-b border-red-100 bg-red-50 px-4 py-2">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Contact Info - Edit Mode */}
      {person && isEditing && (
        <div className="space-y-4 p-4">
          {/* Email (read-only) */}
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500">
              E-Mail (nicht änderbar)
            </label>
            <div className="flex items-center gap-2 rounded-lg bg-neutral-100 px-3 py-2 text-sm text-neutral-500">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {person.email || '-'}
            </div>
          </div>

          {/* Telefon */}
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500">
              Telefon
            </label>
            <input
              type="tel"
              value={formData.telefon}
              onChange={(e) => setFormData({ ...formData, telefon: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="z.B. 079 123 45 67"
            />
          </div>

          {/* Strasse */}
          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-500">
              Strasse
            </label>
            <input
              type="text"
              value={formData.strasse}
              onChange={(e) => setFormData({ ...formData, strasse: e.target.value })}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="z.B. Musterstrasse 1"
            />
          </div>

          {/* PLZ / Ort */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-500">
                PLZ
              </label>
              <input
                type="text"
                value={formData.plz}
                onChange={(e) => setFormData({ ...formData, plz: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="8000"
              />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs font-medium text-neutral-500">
                Ort
              </label>
              <input
                type="text"
                value={formData.ort}
                onChange={(e) => setFormData({ ...formData, ort: e.target.value })}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Zürich"
              />
            </div>
          </div>

          {/* Geburtsdatum (read-only) */}
          {person.geburtstag && (
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-500">
                Geburtsdatum (nicht änderbar)
              </label>
              <div className="flex items-center gap-2 rounded-lg bg-neutral-100 px-3 py-2 text-sm text-neutral-500">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" />
                </svg>
                {formatGeburtsdatum(person.geburtstag)}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="rounded-lg px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              disabled={isPending}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? 'Speichern...' : 'Speichern'}
            </button>
          </div>
        </div>
      )}

      {/* Contact Info - View Mode */}
      {person && !isEditing && (
        <div className="divide-y divide-neutral-100">
          {person.email && (
            <div className="flex items-center gap-3 px-4 py-3">
              <svg className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-sm text-neutral-600">{person.email}</span>
            </div>
          )}

          {person.telefon && (
            <div className="flex items-center gap-3 px-4 py-3">
              <svg className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="text-sm text-neutral-600">{person.telefon}</span>
            </div>
          )}

          {(person.strasse || person.ort) && (
            <div className="flex items-start gap-3 px-4 py-3">
              <svg className="mt-0.5 h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div className="text-sm text-neutral-600">
                {person.strasse && <p>{person.strasse}</p>}
                {person.ort && <p>{person.plz} {person.ort}</p>}
              </div>
            </div>
          )}

          {person.geburtstag && (
            <div className="flex items-center gap-3 px-4 py-3">
              <svg className="h-4 w-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15.546c-.523 0-1.046.151-1.5.454a2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.704 2.704 0 00-3 0 2.704 2.704 0 01-3 0 2.701 2.701 0 00-1.5-.454M9 6v2m3-2v2m3-2v2M9 3h.01M12 3h.01M15 3h.01M21 21v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7h18zm-3-9v-2a2 2 0 00-2-2H8a2 2 0 00-2 2v2h12z" />
              </svg>
              <span className="text-sm text-neutral-600">{formatGeburtsdatum(person.geburtstag)}</span>
            </div>
          )}

          {/* Empty state hint */}
          {!person.telefon && !person.strasse && !person.ort && editable && (
            <div className="px-4 py-3">
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                + Kontaktdaten hinzufügen
              </button>
            </div>
          )}
        </div>
      )}

      {/* Stunden Stats (for active members) */}
      {stundenTotal !== undefined && (
        <div className="border-t border-neutral-100 bg-neutral-50 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="text-center">
              <p className="text-lg font-bold text-neutral-900">{stundenTotal.toFixed(1)}</p>
              <p className="text-xs text-neutral-500">Stunden gesamt</p>
            </div>
            {stundenThisYear !== undefined && (
              <div className="text-center">
                <p className="text-lg font-bold text-green-600">{stundenThisYear.toFixed(1)}</p>
                <p className="text-xs text-neutral-500">{new Date().getFullYear()}</p>
              </div>
            )}
            <Link
              href="/mein-bereich/stundenkonto"
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Details &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* Not linked warning */}
      {!person && (
        <div className="p-4">
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
            <p className="text-sm text-yellow-800">
              Dein Account ist noch nicht mit einem Mitgliederprofil verknüpft.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export type { EditableProfileCardProps }
