'use client'

import { useState, useTransition } from 'react'
import {
  updateDesignSettings,
  resetDesignSettings,
  AVAILABLE_FONTS,
  BORDER_RADIUS_OPTIONS,
  type DesignSettings,
  type DesignSettingsUpdate,
} from '@/lib/actions/design-settings'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Select,
  Tabs,
  Alert,
} from '@/components/ui'

// =============================================================================
// Types
// =============================================================================

interface DesignSettingsFormProps {
  initialSettings: DesignSettings
}

// =============================================================================
// Color Input Component
// =============================================================================

function ColorInput({
  label,
  value,
  onChange,
  name,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  name: string
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-neutral-700">
        {label}
      </label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-10 cursor-pointer rounded border border-neutral-300"
        />
        <Input
          type="text"
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1"
          placeholder="#000000"
        />
      </div>
    </div>
  )
}

// =============================================================================
// Main Form Component
// =============================================================================

export function DesignSettingsForm({ initialSettings }: DesignSettingsFormProps) {
  const [settings, setSettings] = useState<DesignSettings>(initialSettings)
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const updateField = <K extends keyof DesignSettings>(
    field: K,
    value: DesignSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setMessage(null)
    startTransition(async () => {
      const updates: DesignSettingsUpdate = {
        font_primary: settings.font_primary,
        font_secondary: settings.font_secondary,
        font_size_base: settings.font_size_base,
        color_primary: settings.color_primary,
        color_secondary: settings.color_secondary,
        color_accent: settings.color_accent,
        color_background: settings.color_background,
        color_text: settings.color_text,
        color_success: settings.color_success,
        color_warning: settings.color_warning,
        color_error: settings.color_error,
        border_radius: settings.border_radius,
        button_style: settings.button_style,
        shadow_level: settings.shadow_level,
        spacing_scale: settings.spacing_scale,
        logo_url: settings.logo_url,
        favicon_url: settings.favicon_url,
      }

      const result = await updateDesignSettings(updates)

      if (result.success) {
        setMessage({ type: 'success', text: 'Einstellungen gespeichert' })
      } else {
        setMessage({ type: 'error', text: result.error || 'Fehler beim Speichern' })
      }
    })
  }

  const handleReset = async () => {
    if (!confirm('Alle Einstellungen auf Standardwerte zuruecksetzen?')) return

    setMessage(null)
    startTransition(async () => {
      const result = await resetDesignSettings()

      if (result.success) {
        // Reload page to get fresh defaults
        window.location.reload()
      } else {
        setMessage({ type: 'error', text: result.error || 'Fehler beim Zuruecksetzen' })
      }
    })
  }

  const tabs = [
    { id: 'typography', label: 'Typografie' },
    { id: 'colors', label: 'Farben' },
    { id: 'ui', label: 'UI-Parameter' },
    { id: 'branding', label: 'Branding' },
  ]

  return (
    <div className="space-y-6">
      {message && (
        <Alert variant={message.type === 'success' ? 'success' : 'error'}>
          {message.text}
        </Alert>
      )}

      <Tabs tabs={tabs} defaultTab="typography">
        {(activeTab) => (
          <div className="mt-4">
            {/* Typography Tab */}
            {activeTab === 'typography' && (
              <Card>
                <CardHeader>
                  <CardTitle>Typografie</CardTitle>
                  <CardDescription>
                    Schriftarten und Schriftgroessen konfigurieren
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select
                    label="Primaere Schriftart"
                    options={AVAILABLE_FONTS}
                    value={settings.font_primary}
                    onChange={(v) => updateField('font_primary', v as string)}
                    helperText="Wird fuer den Haupttext verwendet"
                  />

                  <Select
                    label="Sekundaere Schriftart (optional)"
                    options={[{ value: '', label: 'Keine' }, ...AVAILABLE_FONTS]}
                    value={settings.font_secondary || ''}
                    onChange={(v) => updateField('font_secondary', v as string || null)}
                    helperText="Fuer Ueberschriften oder spezielle Elemente"
                  />

                  <Select
                    label="Basis-Schriftgroesse"
                    options={[
                      { value: '14px', label: 'Klein (14px)' },
                      { value: '16px', label: 'Standard (16px)' },
                      { value: '18px', label: 'Gross (18px)' },
                    ]}
                    value={settings.font_size_base}
                    onChange={(v) => updateField('font_size_base', v as string)}
                  />
                </CardContent>
              </Card>
            )}

            {/* Colors Tab */}
            {activeTab === 'colors' && (
              <Card>
                <CardHeader>
                  <CardTitle>Farben</CardTitle>
                  <CardDescription>
                    Farbpalette der Applikation definieren
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <ColorInput
                      label="Primaerfarbe"
                      name="color_primary"
                      value={settings.color_primary}
                      onChange={(v) => updateField('color_primary', v)}
                    />
                    <ColorInput
                      label="Sekundaerfarbe"
                      name="color_secondary"
                      value={settings.color_secondary}
                      onChange={(v) => updateField('color_secondary', v)}
                    />
                    <ColorInput
                      label="Akzentfarbe"
                      name="color_accent"
                      value={settings.color_accent}
                      onChange={(v) => updateField('color_accent', v)}
                    />
                    <ColorInput
                      label="Hintergrund"
                      name="color_background"
                      value={settings.color_background}
                      onChange={(v) => updateField('color_background', v)}
                    />
                    <ColorInput
                      label="Textfarbe"
                      name="color_text"
                      value={settings.color_text}
                      onChange={(v) => updateField('color_text', v)}
                    />
                    <div className="sm:col-span-2">
                      <p className="mb-3 text-sm font-medium text-neutral-500">
                        Status-Farben
                      </p>
                    </div>
                    <ColorInput
                      label="Erfolg"
                      name="color_success"
                      value={settings.color_success}
                      onChange={(v) => updateField('color_success', v)}
                    />
                    <ColorInput
                      label="Warnung"
                      name="color_warning"
                      value={settings.color_warning}
                      onChange={(v) => updateField('color_warning', v)}
                    />
                    <ColorInput
                      label="Fehler"
                      name="color_error"
                      value={settings.color_error}
                      onChange={(v) => updateField('color_error', v)}
                    />
                  </div>

                  {/* Color Preview */}
                  <div className="mt-6 rounded-lg border border-neutral-200 p-4">
                    <p className="mb-3 text-sm font-medium text-neutral-700">Vorschau</p>
                    <div className="flex flex-wrap gap-2">
                      <div
                        className="flex h-10 items-center rounded-lg px-4 text-sm font-medium text-white"
                        style={{ backgroundColor: settings.color_primary }}
                      >
                        Primaer
                      </div>
                      <div
                        className="flex h-10 items-center rounded-lg px-4 text-sm font-medium text-white"
                        style={{ backgroundColor: settings.color_secondary }}
                      >
                        Sekundaer
                      </div>
                      <div
                        className="flex h-10 items-center rounded-lg px-4 text-sm font-medium text-white"
                        style={{ backgroundColor: settings.color_accent }}
                      >
                        Akzent
                      </div>
                      <div
                        className="flex h-10 items-center rounded-lg px-4 text-sm font-medium text-white"
                        style={{ backgroundColor: settings.color_success }}
                      >
                        Erfolg
                      </div>
                      <div
                        className="flex h-10 items-center rounded-lg px-4 text-sm font-medium text-white"
                        style={{ backgroundColor: settings.color_warning }}
                      >
                        Warnung
                      </div>
                      <div
                        className="flex h-10 items-center rounded-lg px-4 text-sm font-medium text-white"
                        style={{ backgroundColor: settings.color_error }}
                      >
                        Fehler
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* UI Parameters Tab */}
            {activeTab === 'ui' && (
              <Card>
                <CardHeader>
                  <CardTitle>UI-Parameter</CardTitle>
                  <CardDescription>
                    Allgemeine Erscheinungsmerkmale definieren
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select
                    label="Border Radius"
                    options={BORDER_RADIUS_OPTIONS}
                    value={settings.border_radius}
                    onChange={(v) => updateField('border_radius', v as string)}
                    helperText="Rundung von Buttons, Cards und anderen Elementen"
                  />

                  <Select
                    label="Button-Stil"
                    options={[
                      { value: 'filled', label: 'Gefuellt' },
                      { value: 'outline', label: 'Umriss' },
                    ]}
                    value={settings.button_style}
                    onChange={(v) => updateField('button_style', v as 'filled' | 'outline')}
                  />

                  <Select
                    label="Schatten-Intensitaet"
                    options={[
                      { value: 'none', label: 'Keine Schatten' },
                      { value: 'soft', label: 'Weich' },
                      { value: 'strong', label: 'Stark' },
                    ]}
                    value={settings.shadow_level}
                    onChange={(v) => updateField('shadow_level', v as 'none' | 'soft' | 'strong')}
                  />

                  <Select
                    label="Abstandsskala"
                    options={[
                      { value: 'compact', label: 'Kompakt' },
                      { value: 'normal', label: 'Normal' },
                      { value: 'relaxed', label: 'Entspannt' },
                    ]}
                    value={settings.spacing_scale}
                    onChange={(v) => updateField('spacing_scale', v as 'compact' | 'normal' | 'relaxed')}
                    helperText="Beeinflusst Abstaende zwischen Elementen"
                  />

                  {/* UI Preview */}
                  <div className="mt-6 rounded-lg border border-neutral-200 p-4">
                    <p className="mb-3 text-sm font-medium text-neutral-700">Vorschau</p>
                    <div className="flex flex-wrap gap-4">
                      <div
                        className={`
                          px-4 py-2 font-medium text-white
                          ${settings.border_radius}
                          ${settings.shadow_level === 'none' ? '' : settings.shadow_level === 'soft' ? 'shadow-md' : 'shadow-lg'}
                        `}
                        style={{
                          backgroundColor: settings.button_style === 'filled' ? settings.color_primary : 'transparent',
                          color: settings.button_style === 'filled' ? 'white' : settings.color_primary,
                          border: settings.button_style === 'outline' ? `2px solid ${settings.color_primary}` : 'none',
                        }}
                      >
                        Button-Vorschau
                      </div>
                      <div
                        className={`
                          border border-neutral-200 bg-white p-4
                          ${settings.border_radius}
                          ${settings.shadow_level === 'none' ? '' : settings.shadow_level === 'soft' ? 'shadow-md' : 'shadow-lg'}
                        `}
                      >
                        Card-Vorschau
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Branding Tab */}
            {activeTab === 'branding' && (
              <Card>
                <CardHeader>
                  <CardTitle>Branding</CardTitle>
                  <CardDescription>
                    Logo und Markenidentitaet konfigurieren
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    label="Logo URL"
                    type="url"
                    value={settings.logo_url || ''}
                    onChange={(e) => updateField('logo_url', e.target.value || null)}
                    placeholder="https://example.com/logo.png"
                    helperText="URL zu einem Logobild (PNG, SVG empfohlen)"
                  />

                  <Input
                    label="Favicon URL"
                    type="url"
                    value={settings.favicon_url || ''}
                    onChange={(e) => updateField('favicon_url', e.target.value || null)}
                    placeholder="https://example.com/favicon.ico"
                    helperText="URL zum Favicon (ICO, PNG, SVG)"
                  />

                  {/* Logo Preview */}
                  {settings.logo_url && (
                    <div className="mt-4">
                      <p className="mb-2 text-sm font-medium text-neutral-700">Logo-Vorschau</p>
                      <div className="inline-block rounded-lg border border-neutral-200 bg-white p-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={settings.logo_url}
                          alt="Logo Vorschau"
                          className="max-h-16"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none'
                          }}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </Tabs>

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-neutral-200 pt-6">
        <Button
          variant="ghost"
          onClick={handleReset}
          disabled={isPending}
        >
          Auf Standard zuruecksetzen
        </Button>

        <Button
          onClick={handleSave}
          loading={isPending}
        >
          Einstellungen speichern
        </Button>
      </div>

      {/* Last Updated Info */}
      {initialSettings.updated_at && (
        <p className="text-sm text-neutral-500">
          Zuletzt aktualisiert:{' '}
          {new Date(initialSettings.updated_at).toLocaleDateString('de-CH', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      )}
    </div>
  )
}
