'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { generateSchichtenFromTemplate } from '@/lib/actions/schicht-generator'
import { getTemplate } from '@/lib/actions/templates'
import type { AuffuehrungTemplate, TemplateMitDetails } from '@/lib/supabase/types'
import { Button, ConfirmDialog } from '@/components/ui'

interface TemplateSelectorProps {
  veranstaltungId: string
  templates: AuffuehrungTemplate[]
  startzeit?: string
}

export function TemplateSelector({ veranstaltungId, templates }: TemplateSelectorProps) {
  const router = useRouter()
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [templateDetails, setTemplateDetails] = useState<TemplateMitDetails | null>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSelectTemplate = async (templateId: string) => {
    setSelectedTemplateId(templateId)
    setIsLoadingDetails(true)
    setError(null)

    try {
      const details = await getTemplate(templateId)
      setTemplateDetails(details)
    } catch (err) {
      console.error('Error loading template details:', err)
      setError('Fehler beim Laden der Template-Details')
    } finally {
      setIsLoadingDetails(false)
    }
  }

  const handleGenerate = async () => {
    if (!selectedTemplateId) return

    setIsGenerating(true)
    setError(null)

    try {
      const result = await generateSchichtenFromTemplate(veranstaltungId, selectedTemplateId)

      if (!result.success) {
        setError(result.error ?? 'Fehler beim Generieren der Schichten')
        setShowConfirm(false)
        return
      }

      // Success - redirect to the auffuehrung page
      router.push(`/auffuehrungen/${veranstaltungId}` as never)
      router.refresh()
    } catch (err) {
      console.error('Error generating schichten:', err)
      setError('Ein unerwarteter Fehler ist aufgetreten')
      setShowConfirm(false)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-error-50 p-4 text-sm text-error-700">
          {error}
        </div>
      )}

      {/* Template Selection Dropdown */}
      <div>
        <label className="mb-2 block text-sm font-medium text-neutral-700">
          Template auswaehlen
        </label>
        <select
          value={selectedTemplateId ?? ''}
          onChange={(e) => handleSelectTemplate(e.target.value)}
          className="block w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
        >
          <option value="">-- Bitte waehlen --</option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
              {template.beschreibung && ` - ${template.beschreibung}`}
            </option>
          ))}
        </select>
      </div>

      {/* Loading State */}
      {isLoadingDetails && (
        <div className="flex items-center gap-2 text-neutral-500">
          <svg
            className="h-5 w-5 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Lade Template-Details...</span>
        </div>
      )}

      {/* Template Preview */}
      {templateDetails && !isLoadingDetails && (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
          <h4 className="font-medium text-neutral-900">{templateDetails.name}</h4>
          {templateDetails.beschreibung && (
            <p className="mt-1 text-sm text-neutral-600">{templateDetails.beschreibung}</p>
          )}

          {/* Stats */}
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded bg-white p-3 shadow-sm">
              <p className="text-lg font-semibold text-neutral-900">
                {templateDetails.zeitbloecke.length}
              </p>
              <p className="text-xs text-neutral-500">Zeitbloecke</p>
            </div>
            <div className="rounded bg-white p-3 shadow-sm">
              <p className="text-lg font-semibold text-neutral-900">
                {templateDetails.schichten.length}
              </p>
              <p className="text-xs text-neutral-500">Schichten</p>
            </div>
            <div className="rounded bg-white p-3 shadow-sm">
              <p className="text-lg font-semibold text-neutral-900">
                {templateDetails.schichten.reduce((sum, s) => sum + s.anzahl_benoetigt, 0)}
              </p>
              <p className="text-xs text-neutral-500">Helfer-Slots</p>
            </div>
            <div className="rounded bg-white p-3 shadow-sm">
              <p className="text-lg font-semibold text-neutral-900">
                {templateDetails.info_bloecke.length}
              </p>
              <p className="text-xs text-neutral-500">Info-Bloecke</p>
            </div>
          </div>

          {/* Zeitbloecke Preview */}
          {templateDetails.zeitbloecke.length > 0 && (
            <div className="mt-4">
              <h5 className="mb-2 text-sm font-medium text-neutral-700">
                Zeitbloecke
              </h5>
              <div className="space-y-1">
                {templateDetails.zeitbloecke
                  .sort((a, b) => a.sortierung - b.sortierung)
                  .slice(0, 5)
                  .map((zb) => (
                    <div
                      key={zb.id}
                      className="flex items-center justify-between rounded bg-white px-3 py-2 text-sm"
                    >
                      <span className="font-medium text-neutral-900">{zb.name}</span>
                      <span className="text-neutral-500">
                        {zb.startzeit} - {zb.endzeit}
                      </span>
                    </div>
                  ))}
                {templateDetails.zeitbloecke.length > 5 && (
                  <p className="text-xs text-neutral-500">
                    ... und {templateDetails.zeitbloecke.length - 5} weitere
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Generate Button */}
          <div className="mt-6">
            <Button onClick={() => setShowConfirm(true)} className="w-full sm:w-auto">
              Schichten generieren
            </Button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={showConfirm}
        onCancel={() => setShowConfirm(false)}
        onConfirm={handleGenerate}
        title="Schichten generieren"
        message={
          templateDetails
            ? `Moechten Sie ${templateDetails.zeitbloecke.length} Zeitbloecke mit ${templateDetails.schichten.length} Schichten und ${templateDetails.schichten.reduce((sum, s) => sum + s.anzahl_benoetigt, 0)} Helfer-Slots aus dem Template "${templateDetails.name}" erstellen?`
            : 'Moechten Sie die Schichten generieren?'
        }
        confirmLabel={isGenerating ? 'Generieren...' : 'Generieren'}
      />
    </div>
  )
}
