'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
// Simplified scene type for the generator
type SimpleSzene = {
  id: string
  nummer: number
  titel: string
  dauer_minuten: number | null
}
import {
  WIEDERHOLUNG_TYP_LABELS,
  WOCHENTAG_LABELS,
  type WiederholungTyp,
  type ProbenGeneratorFormData,
} from '@/lib/validations/probenplan'
import {
  previewGeneratedProben,
  generateProben,
  createProbenplanTemplate,
  deleteProbenplanTemplate,
  type GeneratedProbe,
  type ProbenplanTemplate,
} from '@/lib/actions/probenplan'
import { suggestOptimalProbeTermin } from '@/lib/actions/proben'
import type { OptimalProbeTermin, StueckStatus } from '@/lib/supabase/types'
import { KonfliktAnzeige } from './KonfliktAnzeige'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

type StueckMitSzenen = {
  id: string
  titel: string
  status: StueckStatus
  szenen: SimpleSzene[]
}

type TemplateMitDetails = ProbenplanTemplate & {
  stueck?: { id: string; titel: string }
}

interface ProbenplanGeneratorProps {
  stuecke: StueckMitSzenen[]
  templates: TemplateMitDetails[]
}

export function ProbenplanGenerator({
  stuecke,
  templates,
}: ProbenplanGeneratorProps) {
  const router = useRouter()
  const [selectedStueck, setSelectedStueck] = useState<StueckMitSzenen | null>(
    stuecke[0] || null
  )
  const [selectedSzenen, setSelectedSzenen] = useState<string[]>([])
  const [formData, setFormData] = useState({
    titel_prefix: '',
    beschreibung: '',
    wiederholung_typ: 'woechentlich' as WiederholungTyp,
    wochentag: 1, // Monday
    startzeit: '19:00',
    endzeit: '22:00',
    start_datum: '',
    end_datum: '',
    ort: '',
    auto_einladen: true,
  })

  const [preview, setPreview] = useState<GeneratedProbe[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSavingTemplate, setIsSavingTemplate] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Template management
  const [showSaveTemplateDialog, setShowSaveTemplateDialog] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null)

  // Optimal dates
  const [optimalTermine, setOptimalTermine] = useState<OptimalProbeTermin[]>([])
  const [isLoadingTermine, setIsLoadingTermine] = useState(false)

  const handleSuggestTermine = useCallback(async () => {
    if (!selectedStueck || !formData.start_datum || !formData.end_datum) {
      setError('Bitte Stück, Start- und Enddatum angeben')
      return
    }
    setIsLoadingTermine(true)
    setError(null)
    const result = await suggestOptimalProbeTermin(
      selectedStueck.id,
      selectedSzenen,
      formData.start_datum,
      formData.end_datum
    )
    setOptimalTermine(result)
    setIsLoadingTermine(false)
    if (result.length === 0) {
      setError('Keine optimalen Termine im angegebenen Zeitraum gefunden')
    }
  }, [selectedStueck, selectedSzenen, formData.start_datum, formData.end_datum])

  // Handle Stück selection
  const handleStueckChange = (stueckId: string) => {
    const stueck = stuecke.find((s) => s.id === stueckId)
    setSelectedStueck(stueck || null)
    setSelectedSzenen([])
    setPreview(null)
  }

  // Handle scene selection
  const toggleSzene = (szeneId: string) => {
    setSelectedSzenen((prev) =>
      prev.includes(szeneId)
        ? prev.filter((id) => id !== szeneId)
        : [...prev, szeneId]
    )
    setPreview(null)
  }

  const selectAllSzenen = () => {
    if (!selectedStueck) return
    setSelectedSzenen(selectedStueck.szenen.map((s) => s.id))
    setPreview(null)
  }

  const clearSzenen = () => {
    setSelectedSzenen([])
    setPreview(null)
  }

  // Handle form input
  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    setPreview(null)
  }

  // Load template
  const loadTemplate = (template: TemplateMitDetails) => {
    setSelectedStueck(stuecke.find((s) => s.id === template.stueck_id) || null)
    setSelectedSzenen(template.szenen?.map((s) => s.szene_id) || [])
    setFormData({
      titel_prefix: template.name,
      beschreibung: template.beschreibung || '',
      wiederholung_typ: template.wiederholung_typ,
      wochentag: template.wochentag,
      startzeit: template.startzeit || '19:00',
      endzeit: template.endzeit || '22:00',
      start_datum: '',
      end_datum: '',
      ort: template.ort || '',
      auto_einladen: true,
    })
    setPreview(null)
    setError(null)
    setSuccessMessage(`Vorlage "${template.name}" geladen`)
    setTimeout(() => setSuccessMessage(null), 3000)
  }

  // Preview generation
  const handlePreview = async () => {
    if (!selectedStueck) {
      setError('Bitte ein Stück auswählen')
      return
    }
    if (!formData.titel_prefix) {
      setError('Bitte einen Titel-Präfix eingeben')
      return
    }
    if (!formData.start_datum || !formData.end_datum) {
      setError('Bitte Start- und Enddatum angeben')
      return
    }

    setIsLoading(true)
    setError(null)

    const data: ProbenGeneratorFormData = {
      stueck_id: selectedStueck.id,
      titel_prefix: formData.titel_prefix,
      beschreibung: formData.beschreibung || undefined,
      wiederholung_typ: formData.wiederholung_typ,
      wochentag: formData.wochentag,
      startzeit: formData.startzeit,
      endzeit: formData.endzeit,
      start_datum: formData.start_datum,
      end_datum: formData.end_datum,
      ort: formData.ort || undefined,
      szenen_ids: selectedSzenen.length > 0 ? selectedSzenen : undefined,
      auto_einladen: formData.auto_einladen,
    }

    const result = await previewGeneratedProben(data)
    setIsLoading(false)

    if (result.success && result.proben) {
      setPreview(result.proben)
      if (result.proben.length === 0) {
        setError('Keine Termine im angegebenen Zeitraum gefunden')
      }
    } else {
      setError(result.error || 'Fehler bei der Vorschau')
    }
  }

  // Generate proben
  const handleGenerate = async () => {
    if (!selectedStueck || !preview || preview.length === 0) return

    setIsGenerating(true)
    setError(null)

    const data: ProbenGeneratorFormData = {
      stueck_id: selectedStueck.id,
      titel_prefix: formData.titel_prefix,
      beschreibung: formData.beschreibung || undefined,
      wiederholung_typ: formData.wiederholung_typ,
      wochentag: formData.wochentag,
      startzeit: formData.startzeit,
      endzeit: formData.endzeit,
      start_datum: formData.start_datum,
      end_datum: formData.end_datum,
      ort: formData.ort || undefined,
      szenen_ids: selectedSzenen.length > 0 ? selectedSzenen : undefined,
      auto_einladen: formData.auto_einladen,
    }

    const result = await generateProben(data)
    setIsGenerating(false)

    if (result.success) {
      setSuccessMessage(`${result.created_count} Proben erfolgreich erstellt!`)
      setTimeout(() => {
        router.push('/proben')
        router.refresh()
      }, 2000)
    } else {
      setError(result.error || 'Fehler beim Erstellen der Proben')
    }
  }

  // Save template
  const handleSaveTemplate = async () => {
    if (!selectedStueck || !templateName) return

    setIsSavingTemplate(true)
    setError(null)

    const result = await createProbenplanTemplate({
      stueck_id: selectedStueck.id,
      name: templateName,
      beschreibung: formData.beschreibung || undefined,
      wiederholung_typ: formData.wiederholung_typ,
      wochentag: formData.wochentag,
      startzeit: formData.startzeit,
      endzeit: formData.endzeit,
      dauer_wochen: 1,
      ort: formData.ort || undefined,
      szenen_ids: selectedSzenen.length > 0 ? selectedSzenen : undefined,
    })

    setIsSavingTemplate(false)
    setShowSaveTemplateDialog(false)
    setTemplateName('')

    if (result.success) {
      setSuccessMessage('Vorlage gespeichert')
      router.refresh()
    } else {
      setError(result.error || 'Fehler beim Speichern der Vorlage')
    }
  }

  // Delete template
  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return

    const result = await deleteProbenplanTemplate(templateToDelete)
    setTemplateToDelete(null)

    if (result.success) {
      setSuccessMessage('Vorlage gelöscht')
      router.refresh()
    } else {
      setError(result.error || 'Fehler beim Löschen der Vorlage')
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-CH', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Messages */}
      {error && (
        <div className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-error-700">
          {error}
        </div>
      )}
      {successMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700">
          {successMessage}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Configuration Panel */}
        <div className="space-y-6 lg:col-span-2">
          {/* Stück Selection */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              1. Stück auswählen
            </h2>

            <select
              value={selectedStueck?.id || ''}
              onChange={(e) => handleStueckChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
            >
              {stuecke.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.titel}
                </option>
              ))}
            </select>
          </div>

          {/* Scene Selection */}
          {selectedStueck && selectedStueck.szenen.length > 0 && (
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  2. Szenen auswählen (optional)
                </h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAllSzenen}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    Alle
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={clearSzenen}
                    className="text-sm text-gray-600 hover:text-gray-700"
                  >
                    Keine
                  </button>
                </div>
              </div>

              <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-4">
                {selectedStueck.szenen
                  .sort((a, b) => a.nummer - b.nummer)
                  .map((szene) => (
                    <label
                      key={szene.id}
                      className="flex cursor-pointer items-center gap-3"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSzenen.includes(szene.id)}
                        onChange={() => toggleSzene(szene.id)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                        {szene.nummer}
                      </span>
                      <span className="text-sm text-gray-900">
                        {szene.titel}
                      </span>
                      {szene.dauer_minuten && (
                        <span className="text-xs text-gray-500">
                          ({szene.dauer_minuten} Min.)
                        </span>
                      )}
                    </label>
                  ))}
              </div>
              {selectedSzenen.length > 0 && (
                <p className="mt-2 text-sm text-gray-500">
                  {selectedSzenen.length} Szene
                  {selectedSzenen.length !== 1 && 'n'} ausgewählt
                </p>
              )}
            </div>
          )}

          {/* Recurring Settings */}
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              3. Wiederkehrende Termine
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Titel-Präfix *
                </label>
                <input
                  type="text"
                  name="titel_prefix"
                  value={formData.titel_prefix}
                  onChange={handleInputChange}
                  placeholder="z.B. Probe Akt 1"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Proben werden nummeriert: &quot;{formData.titel_prefix || 'Probe'} 1&quot;, &quot;{formData.titel_prefix || 'Probe'} 2&quot;, ...
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Wiederholung *
                </label>
                <select
                  name="wiederholung_typ"
                  value={formData.wiederholung_typ}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                >
                  {Object.entries(WIEDERHOLUNG_TYP_LABELS).map(
                    ([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Wochentag *
                </label>
                <select
                  name="wochentag"
                  value={formData.wochentag}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      wochentag: parseInt(e.target.value),
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                >
                  {Object.entries(WOCHENTAG_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Ort
                </label>
                <input
                  type="text"
                  name="ort"
                  value={formData.ort}
                  onChange={handleInputChange}
                  placeholder="z.B. Gemeindesaal"
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Startzeit *
                </label>
                <input
                  type="time"
                  name="startzeit"
                  value={formData.startzeit}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Endzeit *
                </label>
                <input
                  type="time"
                  name="endzeit"
                  value={formData.endzeit}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Von Datum *
                </label>
                <input
                  type="date"
                  name="start_datum"
                  value={formData.start_datum}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Bis Datum *
                </label>
                <input
                  type="date"
                  name="end_datum"
                  value={formData.end_datum}
                  onChange={handleInputChange}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="auto_einladen"
                  checked={formData.auto_einladen}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">
                  Besetzte Darsteller automatisch einladen
                </span>
              </label>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">
                Beschreibung (optional)
              </label>
              <textarea
                name="beschreibung"
                value={formData.beschreibung}
                onChange={handleInputChange}
                rows={2}
                className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                placeholder="Zusätzliche Informationen..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handlePreview}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2 font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
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
                  Berechne...
                </>
              ) : (
                <>
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  Vorschau
                </>
              )}
            </button>

            {selectedStueck && (
              <button
                type="button"
                onClick={() => setShowSaveTemplateDialog(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                  />
                </svg>
                Als Vorlage speichern
              </button>
            )}

            {selectedStueck &&
              formData.start_datum &&
              formData.end_datum && (
                <button
                  type="button"
                  onClick={handleSuggestTermine}
                  disabled={isLoadingTermine}
                  className="inline-flex items-center gap-2 rounded-lg border border-primary-300 bg-primary-50 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-100 disabled:opacity-50"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  {isLoadingTermine
                    ? 'Berechne...'
                    : 'Optimale Termine vorschlagen'}
                </button>
              )}
          </div>

          {/* Optimal Date Suggestions */}
          {optimalTermine.length > 0 && (
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Optimale Probentermine
              </h2>
              <p className="mb-3 text-sm text-gray-500">
                Basierend auf der Verfügbarkeit der Besetzung — höchste
                Verfügbarkeit zuerst.
              </p>
              <div className="space-y-2">
                {optimalTermine.map((t) => (
                  <div
                    key={t.datum}
                    className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3"
                  >
                    <div>
                      <span className="font-medium text-gray-900">
                        {t.wochentag},{' '}
                        {new Date(t.datum).toLocaleDateString('de-CH', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="ml-3 text-sm text-gray-500">
                        {t.verfuegbareCount}/{t.totalCast} verfügbar
                        {t.eingeschraenktCount > 0 &&
                          `, ${t.eingeschraenktCount} eingeschränkt`}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-2 w-24 overflow-hidden rounded-full bg-gray-200">
                        <div
                          className="bg-green-500"
                          style={{
                            width: `${(t.verfuegbareCount / t.totalCast) * 100}%`,
                          }}
                        />
                        <div
                          className="bg-amber-400"
                          style={{
                            width: `${(t.eingeschraenktCount / t.totalCast) * 100}%`,
                          }}
                        />
                      </div>
                      <span className="w-12 text-right text-sm font-medium text-gray-700">
                        {t.verfuegbarkeitsProzent}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {optimalTermine.some((t) => t.nichtVerfuegbar.length > 0) && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    Details zu nicht verfügbaren Personen
                  </summary>
                  <div className="mt-2 space-y-2">
                    {optimalTermine
                      .filter((t) => t.nichtVerfuegbar.length > 0)
                      .map((t) => (
                        <div key={t.datum} className="text-sm">
                          <span className="font-medium text-gray-700">
                            {new Date(t.datum).toLocaleDateString('de-CH')}:
                          </span>{' '}
                          <span className="text-gray-500">
                            {t.nichtVerfuegbar.map((p) => p.personName).join(', ')}
                          </span>
                        </div>
                      ))}
                  </div>
                </details>
              )}
            </div>
          )}

          {/* Preview */}
          {preview && preview.length > 0 && (
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Vorschau: {preview.length} Proben
                </h2>
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2 font-medium text-white hover:bg-green-700 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <svg
                        className="h-4 w-4 animate-spin"
                        viewBox="0 0 24 24"
                        fill="none"
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
                      Erstelle...
                    </>
                  ) : (
                    <>
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Proben erstellen
                    </>
                  )}
                </button>
              </div>

              <div className="divide-y divide-gray-200">
                {preview.map((probe, index) => (
                  <div key={index} className="py-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          {probe.titel}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(probe.datum)}
                          {probe.startzeit && ` | ${probe.startzeit}`}
                          {probe.endzeit && ` - ${probe.endzeit}`}
                          {probe.ort && ` | ${probe.ort}`}
                        </div>
                      </div>
                      {probe.konflikte.length > 0 && (
                        <KonfliktAnzeige konflikte={probe.konflikte} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Templates Sidebar */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Gespeicherte Vorlagen
          </h2>

          {templates.length === 0 ? (
            <p className="text-sm text-gray-500">
              Noch keine Vorlagen gespeichert.
            </p>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="rounded-lg border border-gray-200 p-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-medium text-gray-900">
                        {template.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {template.stueck?.titel}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {WOCHENTAG_LABELS[template.wochentag as keyof typeof WOCHENTAG_LABELS]},{' '}
                        {template.startzeit?.slice(0, 5) || '19:00'} -{' '}
                        {template.endzeit?.slice(0, 5) || '22:00'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTemplateToDelete(template.id)}
                      className="text-gray-400 hover:text-error-600"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => loadTemplate(template)}
                    className="mt-2 w-full rounded bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
                  >
                    Laden
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Save Template Dialog */}
      {showSaveTemplateDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-neutral-900">
              Vorlage speichern
            </h2>
            <div className="mt-4 space-y-4">
              <p className="text-sm text-gray-600">
                Speichern Sie die aktuellen Einstellungen als wiederverwendbare
                Vorlage.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Vorlagen-Name *
                </label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                  placeholder="z.B. Wöchentliche Akt 1 Probe"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowSaveTemplateDialog(false)
                  setTemplateName('')
                }}
                className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
              >
                Abbrechen
              </button>
              <button
                type="button"
                onClick={handleSaveTemplate}
                disabled={!templateName || isSavingTemplate}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {isSavingTemplate ? 'Speichert...' : 'Speichern'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Template Confirm */}
      <ConfirmDialog
        open={!!templateToDelete}
        title="Vorlage löschen"
        message="Möchten Sie diese Vorlage wirklich löschen? Dies kann nicht rückgängig gemacht werden."
        confirmLabel="Löschen"
        variant="danger"
        onConfirm={handleDeleteTemplate}
        onCancel={() => setTemplateToDelete(null)}
      />
    </div>
  )
}
