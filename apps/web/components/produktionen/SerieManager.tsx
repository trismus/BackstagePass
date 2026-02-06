'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronRight, Users } from 'lucide-react'
import type {
  Auffuehrungsserie,
  Serienauffuehrung,
  AuffuehrungTemplate,
  SerieStatus,
  AuffuehrungsTyp,
} from '@/lib/supabase/types'
import {
  SERIE_STATUS_LABELS,
  AUFFUEHRUNG_TYP_LABELS,
  WOCHENTAG_LABELS,
  type Wochentag,
} from '@/lib/supabase/types'
import {
  createSerie,
  updateSerie,
  deleteSerie,
  generiereAuffuehrungen,
  generiereAuffuehrungenWiederholung,
  deleteSerienauffuehrung,
} from '@/lib/actions/produktionen'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PartnerKontingentManager } from './PartnerKontingentManager'

interface SerieManagerProps {
  produktionId: string
  serien: Auffuehrungsserie[]
  auffuehrungen: Record<string, Serienauffuehrung[]>
  templates: Pick<AuffuehrungTemplate, 'id' | 'name'>[]
  canEdit: boolean
}

type GeneratorMode = 'manual' | 'recurring'

interface ManualTermin {
  datum: string
  startzeit: string
  typ: AuffuehrungsTyp
}

export function SerieManager({
  produktionId,
  serien,
  auffuehrungen,
  templates,
  canEdit,
}: SerieManagerProps) {
  const router = useRouter()
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [generatingFor, setGeneratingFor] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'serie' | 'auffuehrung'
    id: string
    name: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expandedKontingente, setExpandedKontingente] = useState<Set<string>>(new Set())

  // Form state for new/edit Serie
  const [formData, setFormData] = useState({
    name: '',
    beschreibung: '',
    status: 'draft' as SerieStatus,
    standard_ort: '',
    standard_startzeit: '',
    standard_einlass_minuten: 30,
    template_id: '',
  })

  // Generator state
  const [generatorMode, setGeneratorMode] = useState<GeneratorMode>('manual')
  const [manualTermine, setManualTermine] = useState<ManualTermin[]>([
    { datum: '', startzeit: '', typ: 'regulaer' },
  ])
  const [recurringConfig, setRecurringConfig] = useState({
    startDatum: '',
    endDatum: '',
    wochentage: [] as number[],
    startzeit: '',
    ausnahmen: [] as string[],
  })

  const resetForm = () => {
    setFormData({
      name: '',
      beschreibung: '',
      status: 'draft',
      standard_ort: '',
      standard_startzeit: '',
      standard_einlass_minuten: 30,
      template_id: '',
    })
    setIsAdding(false)
    setEditingId(null)
    setError(null)
  }

  const handleEditSerie = (serie: Auffuehrungsserie) => {
    setFormData({
      name: serie.name,
      beschreibung: serie.beschreibung || '',
      status: serie.status,
      standard_ort: serie.standard_ort || '',
      standard_startzeit: serie.standard_startzeit || '',
      standard_einlass_minuten: serie.standard_einlass_minuten || 30,
      template_id: serie.template_id || '',
    })
    setEditingId(serie.id)
    setIsAdding(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const data = {
      produktion_id: produktionId,
      name: formData.name,
      beschreibung: formData.beschreibung || null,
      status: formData.status,
      standard_ort: formData.standard_ort || null,
      standard_startzeit: formData.standard_startzeit || null,
      standard_einlass_minuten: formData.standard_einlass_minuten,
      template_id: formData.template_id || null,
      stueck_id: null,
      datum_von: null,
      datum_bis: null,
    }

    try {
      if (editingId) {
        const result = await updateSerie(editingId, data)
        if (!result.success) {
          setError(result.error || 'Fehler beim Speichern')
          return
        }
      } else {
        const result = await createSerie(data)
        if (!result.success) {
          setError(result.error || 'Fehler beim Erstellen')
          return
        }
      }
      resetForm()
      router.refresh()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    setIsSubmitting(true)

    try {
      let result
      if (deleteConfirm.type === 'serie') {
        result = await deleteSerie(deleteConfirm.id)
      } else {
        result = await deleteSerienauffuehrung(deleteConfirm.id)
      }

      if (!result.success) {
        setError(result.error || 'Fehler beim Löschen')
      } else {
        router.refresh()
      }
    } finally {
      setIsSubmitting(false)
      setDeleteConfirm(null)
    }
  }

  const handleGenerate = async () => {
    if (!generatingFor) return
    setIsSubmitting(true)
    setError(null)

    try {
      let result
      if (generatorMode === 'manual') {
        const validTermine = manualTermine.filter((t) => t.datum)
        if (validTermine.length === 0) {
          setError('Mindestens ein Termin erforderlich')
          return
        }
        result = await generiereAuffuehrungen(generatingFor, validTermine)
      } else {
        if (!recurringConfig.startDatum || !recurringConfig.endDatum) {
          setError('Start- und Enddatum erforderlich')
          return
        }
        if (recurringConfig.wochentage.length === 0) {
          setError('Mindestens ein Wochentag erforderlich')
          return
        }
        result = await generiereAuffuehrungenWiederholung(
          generatingFor,
          recurringConfig
        )
      }

      if (!result.success) {
        setError(result.error || 'Fehler beim Generieren')
      } else {
        setGeneratingFor(null)
        setManualTermine([{ datum: '', startzeit: '', typ: 'regulaer' }])
        setRecurringConfig({
          startDatum: '',
          endDatum: '',
          wochentage: [],
          startzeit: '',
          ausnahmen: [],
        })
        router.refresh()
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const addManualTermin = () => {
    setManualTermine((prev) => [
      ...prev,
      { datum: '', startzeit: '', typ: 'regulaer' },
    ])
  }

  const removeManualTermin = (index: number) => {
    setManualTermine((prev) => prev.filter((_, i) => i !== index))
  }

  const toggleWochentag = (day: number) => {
    setRecurringConfig((prev) => ({
      ...prev,
      wochentage: prev.wochentage.includes(day)
        ? prev.wochentage.filter((d) => d !== day)
        : [...prev.wochentage, day].sort(),
    }))
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('de-CH', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })

  const formatTime = (timeStr: string | null) =>
    timeStr ? timeStr.slice(0, 5) : '–'

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Aufführungsserien
        </h2>
        {canEdit && !isAdding && !editingId && (
          <button
            onClick={() => setIsAdding(true)}
            className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-700"
          >
            + Neue Serie
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-error-700">
          {error}
        </div>
      )}

      {/* Add/Edit Form */}
      {(isAdding || editingId) && canEdit && (
        <form
          onSubmit={handleSubmit}
          className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4"
        >
          <h3 className="mb-4 font-medium text-gray-900">
            {editingId ? 'Serie bearbeiten' : 'Neue Serie'}
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, name: e.target.value }))
                }
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Hauptserie November"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    status: e.target.value as SerieStatus,
                  }))
                }
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
              >
                {Object.entries(SERIE_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Standard-Ort
              </label>
              <input
                type="text"
                value={formData.standard_ort}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, standard_ort: e.target.value }))
                }
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
                placeholder="z.B. Mehrzweckhalle Widen"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Standard-Startzeit
              </label>
              <input
                type="time"
                value={formData.standard_startzeit}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    standard_startzeit: e.target.value,
                  }))
                }
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Einlass (Minuten vor Start)
              </label>
              <input
                type="number"
                min={0}
                max={120}
                value={formData.standard_einlass_minuten}
                onChange={(e) =>
                  setFormData((p) => ({
                    ...p,
                    standard_einlass_minuten: parseInt(e.target.value) || 30,
                  }))
                }
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Template
              </label>
              <select
                value={formData.template_id}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, template_id: e.target.value }))
                }
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
              >
                <option value="">– Kein Template –</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Beschreibung
              </label>
              <textarea
                value={formData.beschreibung}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, beschreibung: e.target.value }))
                }
                rows={2}
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-primary-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:bg-gray-400"
            >
              {isSubmitting ? 'Wird gespeichert...' : 'Speichern'}
            </button>
          </div>
        </form>
      )}

      {/* Generator Modal */}
      {generatingFor && (
        <div className="mb-6 rounded-lg border border-primary-200 bg-primary-50 p-4">
          <h3 className="mb-4 font-medium text-gray-900">
            Aufführungen generieren
          </h3>

          <div className="mb-4 flex gap-4">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={generatorMode === 'manual'}
                onChange={() => setGeneratorMode('manual')}
                className="text-primary-600"
              />
              <span className="text-sm">Einzeltermine</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={generatorMode === 'recurring'}
                onChange={() => setGeneratorMode('recurring')}
                className="text-primary-600"
              />
              <span className="text-sm">Wiederholung</span>
            </label>
          </div>

          {generatorMode === 'manual' ? (
            <div className="space-y-3">
              {manualTermine.map((termin, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="date"
                    value={termin.datum}
                    onChange={(e) =>
                      setManualTermine((prev) =>
                        prev.map((t, i) =>
                          i === idx ? { ...t, datum: e.target.value } : t
                        )
                      )
                    }
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary-500"
                  />
                  <input
                    type="time"
                    value={termin.startzeit}
                    onChange={(e) =>
                      setManualTermine((prev) =>
                        prev.map((t, i) =>
                          i === idx ? { ...t, startzeit: e.target.value } : t
                        )
                      )
                    }
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary-500"
                  />
                  <select
                    value={termin.typ}
                    onChange={(e) =>
                      setManualTermine((prev) =>
                        prev.map((t, i) =>
                          i === idx
                            ? { ...t, typ: e.target.value as AuffuehrungsTyp }
                            : t
                        )
                      )
                    }
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary-500"
                  >
                    {Object.entries(AUFFUEHRUNG_TYP_LABELS).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      )
                    )}
                  </select>
                  {manualTermine.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeManualTermin(idx)}
                      className="text-error-600 hover:text-error-800"
                    >
                      &times;
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addManualTermin}
                className="text-sm text-primary-600 hover:text-primary-800"
              >
                + Termin hinzufügen
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Startdatum *
                </label>
                <input
                  type="date"
                  value={recurringConfig.startDatum}
                  onChange={(e) =>
                    setRecurringConfig((p) => ({
                      ...p,
                      startDatum: e.target.value,
                    }))
                  }
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Enddatum *
                </label>
                <input
                  type="date"
                  value={recurringConfig.endDatum}
                  onChange={(e) =>
                    setRecurringConfig((p) => ({
                      ...p,
                      endDatum: e.target.value,
                    }))
                  }
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Startzeit
                </label>
                <input
                  type="time"
                  value={recurringConfig.startzeit}
                  onChange={(e) =>
                    setRecurringConfig((p) => ({
                      ...p,
                      startzeit: e.target.value,
                    }))
                  }
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Wochentage *
                </label>
                <div className="mt-1 flex flex-wrap gap-1">
                  {([0, 1, 2, 3, 4, 5, 6] as Wochentag[]).map((day) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleWochentag(day)}
                      className={`rounded px-2 py-1 text-xs font-medium ${
                        recurringConfig.wochentage.includes(day)
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {WOCHENTAG_LABELS[day].slice(0, 2)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setGeneratingFor(null)}
              className="px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900"
            >
              Abbrechen
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isSubmitting}
              className="rounded-lg bg-primary-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-primary-700 disabled:bg-gray-400"
            >
              {isSubmitting ? 'Wird generiert...' : 'Generieren'}
            </button>
          </div>
        </div>
      )}

      {/* Serien List */}
      {serien.length === 0 ? (
        <p className="text-gray-500">
          Noch keine Aufführungsserien vorhanden.
        </p>
      ) : (
        <div className="space-y-4">
          {serien.map((serie) => (
            <div
              key={serie.id}
              className="rounded-lg border border-gray-200 p-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">{serie.name}</h3>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        serie.status === 'publiziert'
                          ? 'bg-success-100 text-success-700'
                          : serie.status === 'abgeschlossen'
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-info-100 text-info-700'
                      }`}
                    >
                      {SERIE_STATUS_LABELS[serie.status]}
                    </span>
                  </div>
                  {serie.standard_ort && (
                    <p className="text-sm text-gray-500">{serie.standard_ort}</p>
                  )}
                  {serie.standard_startzeit && (
                    <p className="text-sm text-gray-500">
                      Start: {formatTime(serie.standard_startzeit)} Uhr
                    </p>
                  )}
                </div>
                {canEdit && !generatingFor && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setGeneratingFor(serie.id)}
                      className="rounded bg-primary-50 px-2 py-1 text-xs text-primary-700 hover:bg-primary-100"
                    >
                      + Termine
                    </button>
                    <button
                      onClick={() => handleEditSerie(serie)}
                      className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700 hover:bg-gray-200"
                    >
                      Bearbeiten
                    </button>
                    <button
                      onClick={() =>
                        setDeleteConfirm({
                          type: 'serie',
                          id: serie.id,
                          name: serie.name,
                        })
                      }
                      className="rounded bg-error-50 px-2 py-1 text-xs text-error-700 hover:bg-error-100"
                    >
                      Löschen
                    </button>
                  </div>
                )}
              </div>

              {/* Auffuehrungen for this Serie */}
              {auffuehrungen[serie.id]?.length > 0 && (
                <div className="mt-3 border-t border-gray-100 pt-3">
                  <h4 className="mb-2 text-sm font-medium text-gray-700">
                    Termine ({auffuehrungen[serie.id].length})
                  </h4>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {auffuehrungen[serie.id].map((auff) => (
                      <div
                        key={auff.id}
                        className={`flex items-center justify-between rounded border px-2 py-1 text-sm ${
                          auff.ist_ausnahme
                            ? 'border-warning-200 bg-warning-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div>
                          <span className="font-medium">
                            {formatDate(auff.datum)}
                          </span>
                          {auff.startzeit && (
                            <span className="ml-1 text-gray-500">
                              {formatTime(auff.startzeit)}
                            </span>
                          )}
                          {auff.typ !== 'regulaer' && (
                            <span className="ml-1 text-xs text-primary-600">
                              ({AUFFUEHRUNG_TYP_LABELS[auff.typ as AuffuehrungsTyp]})
                            </span>
                          )}
                        </div>
                        {canEdit && (
                          <button
                            onClick={() =>
                              setDeleteConfirm({
                                type: 'auffuehrung',
                                id: auff.id,
                                name: formatDate(auff.datum),
                              })
                            }
                            className="text-error-500 hover:text-error-700"
                          >
                            &times;
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Partner Kontingente Toggle */}
              <div className="mt-3 border-t border-gray-100 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setExpandedKontingente((prev) => {
                      const next = new Set(prev)
                      if (next.has(serie.id)) {
                        next.delete(serie.id)
                      } else {
                        next.add(serie.id)
                      }
                      return next
                    })
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span>Partner-Kontingente</span>
                  </div>
                  {expandedKontingente.has(serie.id) ? (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                </button>

                {expandedKontingente.has(serie.id) && (
                  <div className="mt-2">
                    <PartnerKontingentManager
                      serieId={serie.id}
                      serieName={serie.name}
                      canEdit={canEdit}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!deleteConfirm}
        title={
          deleteConfirm?.type === 'serie'
            ? 'Serie löschen'
            : 'Termin löschen'
        }
        message={
          deleteConfirm?.type === 'serie'
            ? `Möchtest du die Serie "${deleteConfirm?.name}" und alle zugehörigen Termine wirklich löschen?`
            : `Möchtest du den Termin "${deleteConfirm?.name}" wirklich löschen?`
        }
        confirmLabel={isSubmitting ? 'Wird gelöscht...' : 'Löschen'}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm(null)}
        variant="danger"
      />
    </div>
  )
}
