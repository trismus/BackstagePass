'use client'

import { useState } from 'react'
import type { BenachrichtigungsEinstellungen } from '@/lib/supabase/types'
import { saveNotificationSettings } from '@/lib/actions/notifications'

interface NotificationSettingsProps {
  settings: BenachrichtigungsEinstellungen | null
}

// Default settings when user has no saved preferences
const defaultSettings: Omit<BenachrichtigungsEinstellungen, 'id' | 'profile_id' | 'created_at' | 'updated_at'> = {
  email_48h_erinnerung: true,
  email_6h_erinnerung: true,
  email_24h_probe_erinnerung: true,
  email_wochenzusammenfassung: true,
  email_aenderungsbenachrichtigung: true,
  inapp_termin_erinnerung: true,
  inapp_aenderungen: true,
  inapp_neue_termine: true,
  eigene_erinnerungszeiten: [48, 6],
  ruhezeit_von: null,
  ruhezeit_bis: null,
}

export function NotificationSettings({ settings }: NotificationSettingsProps) {
  const [formData, setFormData] = useState(settings || defaultSettings)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const handleToggle = (field: keyof typeof formData) => {
    setFormData((prev) => ({
      ...prev,
      [field]: !prev[field],
    }))
  }

  const handleTimeChange = (field: 'ruhezeit_von' | 'ruhezeit_bis', value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value || null,
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setMessage(null)

    const result = await saveNotificationSettings({
      email_48h_erinnerung: formData.email_48h_erinnerung,
      email_6h_erinnerung: formData.email_6h_erinnerung,
      email_24h_probe_erinnerung: formData.email_24h_probe_erinnerung,
      email_wochenzusammenfassung: formData.email_wochenzusammenfassung,
      email_aenderungsbenachrichtigung: formData.email_aenderungsbenachrichtigung,
      inapp_termin_erinnerung: formData.inapp_termin_erinnerung,
      inapp_aenderungen: formData.inapp_aenderungen,
      inapp_neue_termine: formData.inapp_neue_termine,
      eigene_erinnerungszeiten: formData.eigene_erinnerungszeiten,
      ruhezeit_von: formData.ruhezeit_von,
      ruhezeit_bis: formData.ruhezeit_bis,
    })

    setIsSaving(false)

    if (result.success) {
      setMessage({ type: 'success', text: 'Einstellungen gespeichert' })
    } else {
      setMessage({ type: 'error', text: result.error || 'Fehler beim Speichern' })
    }

    setTimeout(() => setMessage(null), 3000)
  }

  return (
    <div className="space-y-6">
      {message && (
        <div
          className={`rounded-lg px-4 py-3 ${
            message.type === 'success'
              ? 'border border-green-200 bg-green-50 text-green-700'
              : 'border border-error-200 bg-error-50 text-error-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Email Notifications */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          E-Mail Benachrichtigungen
        </h3>
        <div className="space-y-4">
          <ToggleSetting
            label="48 Stunden Erinnerung"
            description="Erinnerung 48 Stunden vor Terminen"
            checked={formData.email_48h_erinnerung}
            onChange={() => handleToggle('email_48h_erinnerung')}
          />
          <ToggleSetting
            label="6 Stunden Erinnerung"
            description="Erinnerung 6 Stunden vor Terminen"
            checked={formData.email_6h_erinnerung}
            onChange={() => handleToggle('email_6h_erinnerung')}
          />
          <ToggleSetting
            label="24 Stunden Proben-Erinnerung"
            description="Erinnerung 24 Stunden vor Proben"
            checked={formData.email_24h_probe_erinnerung}
            onChange={() => handleToggle('email_24h_probe_erinnerung')}
          />
          <ToggleSetting
            label="Wochenzusammenfassung"
            description="Wöchentliche Übersicht deiner kommenden Termine"
            checked={formData.email_wochenzusammenfassung}
            onChange={() => handleToggle('email_wochenzusammenfassung')}
          />
          <ToggleSetting
            label="Änderungsbenachrichtigungen"
            description="Bei Änderungen an Terminen (Zeit, Ort, Absage)"
            checked={formData.email_aenderungsbenachrichtigung}
            onChange={() => handleToggle('email_aenderungsbenachrichtigung')}
          />
        </div>
      </div>

      {/* In-App Notifications */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">
          In-App Benachrichtigungen
        </h3>
        <div className="space-y-4">
          <ToggleSetting
            label="Termin-Erinnerungen"
            description="Erinnerungen an bevorstehende Termine"
            checked={formData.inapp_termin_erinnerung}
            onChange={() => handleToggle('inapp_termin_erinnerung')}
          />
          <ToggleSetting
            label="Änderungen"
            description="Bei Änderungen oder Absagen von Terminen"
            checked={formData.inapp_aenderungen}
            onChange={() => handleToggle('inapp_aenderungen')}
          />
          <ToggleSetting
            label="Neue Termine"
            description="Bei neuen Einladungen zu Proben oder Veranstaltungen"
            checked={formData.inapp_neue_termine}
            onChange={() => handleToggle('inapp_neue_termine')}
          />
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h3 className="mb-4 text-lg font-semibold text-gray-900">Ruhezeiten</h3>
        <p className="mb-4 text-sm text-gray-600">
          Während dieser Zeit werden keine E-Mail-Benachrichtigungen versendet.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">Von</label>
            <input
              type="time"
              value={formData.ruhezeit_von || ''}
              onChange={(e) => handleTimeChange('ruhezeit_von', e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Bis</label>
            <input
              type="time"
              value={formData.ruhezeit_bis || ''}
              onChange={(e) => handleTimeChange('ruhezeit_bis', e.target.value)}
              className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Beispiel: Von 22:00 bis 08:00 für nächtliche Ruhezeit
        </p>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-lg bg-primary-600 px-6 py-2 font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {isSaving ? 'Speichert...' : 'Einstellungen speichern'}
        </button>
      </div>
    </div>
  )
}

function ToggleSetting({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <div className="font-medium text-gray-900">{label}</div>
        <div className="text-sm text-gray-500">{description}</div>
      </div>
      <button
        type="button"
        onClick={onChange}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          checked ? 'bg-primary-600' : 'bg-gray-300'
        }`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}
