'use client'

import { useState } from 'react'
import { Button, Input } from '@/components/ui'
import { Card, CardContent } from '@/components/ui'
import { updateExterneHelferProfile } from '@/lib/actions/helfer-dashboard'
import type { ExterneHelferSelfEditFormData } from '@/lib/validations/externe-helfer'

interface ProfileEditSectionProps {
  helper: {
    vorname: string
    nachname: string
    email: string
    telefon: string | null
  }
  dashboardToken: string
}

export function ProfileEditSection({ helper, dashboardToken }: ProfileEditSectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [formData, setFormData] = useState<ExterneHelferSelfEditFormData>({
    vorname: helper.vorname,
    nachname: helper.nachname,
    telefon: helper.telefon,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  function handleCancel() {
    setFormData({
      vorname: helper.vorname,
      nachname: helper.nachname,
      telefon: helper.telefon,
    })
    setErrors({})
    setMessage(null)
    setIsEditing(false)
  }

  async function handleSave() {
    setErrors({})
    setMessage(null)

    // Client-side validation
    const validationErrors: Record<string, string> = {}
    if (!formData.vorname.trim()) {
      validationErrors.vorname = 'Vorname ist erforderlich'
    }
    if (!formData.nachname.trim()) {
      validationErrors.nachname = 'Nachname ist erforderlich'
    }
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setIsSaving(true)
    try {
      const result = await updateExterneHelferProfile(dashboardToken, {
        vorname: formData.vorname.trim(),
        nachname: formData.nachname.trim(),
        telefon: formData.telefon?.trim() || null,
      })

      if (result.success) {
        setMessage({ type: 'success', text: 'Profil erfolgreich aktualisiert' })
        setIsEditing(false)
      } else {
        setMessage({ type: 'error', text: result.error })
      }
    } catch {
      setMessage({ type: 'error', text: 'Ein unerwarteter Fehler ist aufgetreten' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-neutral-600">Dein Profil</p>
          {!isEditing && (
            <button
              type="button"
              onClick={() => {
                setMessage(null)
                setIsEditing(true)
              }}
              className="text-sm font-medium text-primary-600 hover:text-primary-700"
            >
              Bearbeiten
            </button>
          )}
        </div>

        {/* Success/Error message */}
        {message && (
          <div
            className={`mt-3 rounded-md px-3 py-2 text-sm ${
              message.type === 'success'
                ? 'bg-success-50 text-success-700'
                : 'bg-error-50 text-error-700'
            }`}
          >
            {message.text}
          </div>
        )}

        {isEditing ? (
          <div className="mt-3 space-y-3">
            <div>
              <label htmlFor="vorname" className="mb-1 block text-sm font-medium text-neutral-700">
                Vorname
              </label>
              <Input
                id="vorname"
                value={formData.vorname}
                onChange={(e) => setFormData({ ...formData, vorname: e.target.value })}
                className={errors.vorname ? 'border-error-500' : ''}
              />
              {errors.vorname && (
                <p className="mt-1 text-xs text-error-600">{errors.vorname}</p>
              )}
            </div>

            <div>
              <label htmlFor="nachname" className="mb-1 block text-sm font-medium text-neutral-700">
                Nachname
              </label>
              <Input
                id="nachname"
                value={formData.nachname}
                onChange={(e) => setFormData({ ...formData, nachname: e.target.value })}
                className={errors.nachname ? 'border-error-500' : ''}
              />
              {errors.nachname && (
                <p className="mt-1 text-xs text-error-600">{errors.nachname}</p>
              )}
            </div>

            <div>
              <label htmlFor="telefon" className="mb-1 block text-sm font-medium text-neutral-700">
                Telefon
              </label>
              <Input
                id="telefon"
                value={formData.telefon ?? ''}
                onChange={(e) => setFormData({ ...formData, telefon: e.target.value || null })}
                placeholder="Optional"
              />
            </div>

            <div>
              <label htmlFor="email-display" className="mb-1 block text-sm font-medium text-neutral-700">
                E-Mail
              </label>
              <Input
                id="email-display"
                value={helper.email}
                disabled
                className="bg-neutral-50 text-neutral-500"
              />
              <p className="mt-1 text-xs text-neutral-400">
                Die E-Mail-Adresse kann nicht geändert werden
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                size="sm"
              >
                {isSaving ? 'Speichern...' : 'Speichern'}
              </Button>
              <Button
                onClick={handleCancel}
                disabled={isSaving}
                variant="ghost"
                size="sm"
              >
                Abbrechen
              </Button>
            </div>
          </div>
        ) : (
          <div className="mt-2">
            <p className="font-semibold text-neutral-900">
              {helper.vorname} {helper.nachname}
            </p>
            <p className="text-sm text-neutral-500">{helper.email}</p>
            {helper.telefon && (
              <p className="text-sm text-neutral-500">{helper.telefon}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
