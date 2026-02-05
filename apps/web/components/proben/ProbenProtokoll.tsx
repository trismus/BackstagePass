'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type {
  ProbenProtokollMitDetails,
  ProtokollTemplate,
  Szene,
  Person,
  SzenenProbenStatus,
  AufgabenPrioritaet,
} from '@/lib/supabase/types'
import {
  createOrUpdateProtokoll,
  updateSzenenNotiz,
  createProtokollAufgabe,
  updateProtokollAufgabe,
  deleteProtokollAufgabe,
  updateProtokollStatus,
  exportProtokollAsText,
} from '@/lib/actions/proben-protokoll'

const STATUS_LABELS: Record<SzenenProbenStatus, string> = {
  geprobt: 'Geprobt',
  teilweise: 'Teilweise',
  nicht_geprobt: 'Nicht geprobt',
  probleme: 'Probleme',
}

const PRIORITAET_LABELS: Record<AufgabenPrioritaet, string> = {
  niedrig: 'Niedrig',
  normal: 'Normal',
  hoch: 'Hoch',
  dringend: 'Dringend',
}

interface ProbenProtokollProps {
  probeId: string
  protokoll: ProbenProtokollMitDetails | null
  templates: ProtokollTemplate[]
  szenen: Szene[]
  teilnehmer: { person: Person }[]
}

export function ProbenProtokoll({
  probeId,
  protokoll,
  templates,
  szenen,
  teilnehmer,
}: ProbenProtokollProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [allgemeineNotizen, setAllgemeineNotizen] = useState(
    protokoll?.allgemeine_notizen || ''
  )
  const [anwesenheitsNotizen, setAnwesenheitsNotizen] = useState(
    protokoll?.anwesenheits_notizen || ''
  )
  const [selectedTemplate, setSelectedTemplate] = useState(
    protokoll?.template_id || templates.find((t) => t.ist_standard)?.id || ''
  )
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Scene notes state
  const [szenenNotizen, setSzenenNotizen] = useState<
    Record<
      string,
      { notizen: string; status: SzenenProbenStatus | ''; fortschritt: number }
    >
  >(() => {
    const initial: Record<
      string,
      { notizen: string; status: SzenenProbenStatus | ''; fortschritt: number }
    > = {}
    for (const szene of szenen) {
      const existing = protokoll?.szenen_notizen?.find(
        (n) => n.szene_id === szene.id
      )
      initial[szene.id] = {
        notizen: existing?.notizen || '',
        status: existing?.status || '',
        fortschritt: existing?.fortschritt || 0,
      }
    }
    return initial
  })

  // New task form
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [newTask, setNewTask] = useState({
    titel: '',
    beschreibung: '',
    zustaendig_id: '',
    faellig_bis: '',
    prioritaet: 'normal' as AufgabenPrioritaet,
  })

  const handleSave = async () => {
    setIsLoading(true)
    setError(null)

    const result = await createOrUpdateProtokoll(probeId, {
      template_id: selectedTemplate || null,
      allgemeine_notizen: allgemeineNotizen || null,
      anwesenheits_notizen: anwesenheitsNotizen || null,
    })

    if (!result.success) {
      setError(result.error || 'Fehler beim Speichern')
      setIsLoading(false)
      return
    }

    // Save scene notes
    for (const [szeneId, notiz] of Object.entries(szenenNotizen)) {
      if (notiz.notizen || notiz.status || notiz.fortschritt) {
        await updateSzenenNotiz(result.id!, szeneId, {
          notizen: notiz.notizen || null,
          status: (notiz.status as SzenenProbenStatus) || null,
          fortschritt: notiz.fortschritt || null,
        })
      }
    }

    setIsLoading(false)
    setSuccessMessage('Protokoll gespeichert')
    setTimeout(() => setSuccessMessage(null), 3000)
    router.refresh()
  }

  const handleAddTask = async () => {
    if (!newTask.titel || !protokoll?.id) return

    setIsLoading(true)
    const result = await createProtokollAufgabe({
      protokoll_id: protokoll.id,
      titel: newTask.titel,
      beschreibung: newTask.beschreibung || null,
      zustaendig_id: newTask.zustaendig_id || null,
      faellig_bis: newTask.faellig_bis || null,
      prioritaet: newTask.prioritaet,
      status: 'offen',
      szene_id: null,
    })

    setIsLoading(false)

    if (result.success) {
      setNewTask({
        titel: '',
        beschreibung: '',
        zustaendig_id: '',
        faellig_bis: '',
        prioritaet: 'normal',
      })
      setShowTaskForm(false)
      router.refresh()
    } else {
      setError(result.error || 'Fehler beim Erstellen der Aufgabe')
    }
  }

  const handleTaskStatusChange = async (
    aufgabeId: string,
    status: 'erledigt' | 'offen'
  ) => {
    await updateProtokollAufgabe(aufgabeId, { status })
    router.refresh()
  }

  const handleDeleteTask = async (aufgabeId: string) => {
    await deleteProtokollAufgabe(aufgabeId)
    router.refresh()
  }

  const handleExport = async () => {
    const result = await exportProtokollAsText(probeId)
    if (result.success && result.text) {
      // Copy to clipboard
      await navigator.clipboard.writeText(result.text)
      setSuccessMessage('Protokoll in Zwischenablage kopiert')
      setTimeout(() => setSuccessMessage(null), 3000)
    }
  }

  const handleFinalize = async () => {
    if (!protokoll?.id) return
    await updateProtokollStatus(protokoll.id, 'abgeschlossen')
    router.refresh()
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

      {/* Header with actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Probenprotokoll</h2>
          {protokoll?.status && (
            <span
              className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                protokoll.status === 'abgeschlossen'
                  ? 'bg-green-100 text-green-800'
                  : protokoll.status === 'geteilt'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
              }`}
            >
              {protokoll.status === 'entwurf'
                ? 'Entwurf'
                : protokoll.status === 'abgeschlossen'
                  ? 'Abgeschlossen'
                  : 'Geteilt'}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {protokoll && (
            <>
              <button
                type="button"
                onClick={handleExport}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Kopieren
              </button>
              {protokoll.status === 'entwurf' && (
                <button
                  type="button"
                  onClick={handleFinalize}
                  className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700"
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Abschliessen
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Template Selection */}
      <div className="rounded-lg bg-white p-4 shadow">
        <label className="block text-sm font-medium text-gray-700">
          Vorlage
        </label>
        <select
          value={selectedTemplate}
          onChange={(e) => setSelectedTemplate(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Keine Vorlage</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} {t.ist_standard && '(Standard)'}
            </option>
          ))}
        </select>
      </div>

      {/* Attendance */}
      <div className="rounded-lg bg-white p-4 shadow">
        <h3 className="mb-3 font-medium text-gray-900">Anwesenheit</h3>
        <div className="mb-3 flex flex-wrap gap-2">
          {teilnehmer.map((t) => (
            <span
              key={t.person.id}
              className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700"
            >
              {t.person.vorname} {t.person.nachname}
            </span>
          ))}
        </div>
        <textarea
          value={anwesenheitsNotizen}
          onChange={(e) => setAnwesenheitsNotizen(e.target.value)}
          rows={2}
          placeholder="Anwesenheitsnotizen (wer fehlte, wer verspätet, etc.)..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Scene Notes */}
      {szenen.length > 0 && (
        <div className="rounded-lg bg-white p-4 shadow">
          <h3 className="mb-3 font-medium text-gray-900">Szenen-Notizen</h3>
          <div className="space-y-4">
            {szenen
              .sort((a, b) => a.nummer - b.nummer)
              .map((szene) => (
                <div
                  key={szene.id}
                  className="rounded-lg border border-gray-200 p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                        {szene.nummer}
                      </span>
                      <span className="font-medium text-gray-900">
                        {szene.titel}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={szenenNotizen[szene.id]?.status || ''}
                        onChange={(e) =>
                          setSzenenNotizen((prev) => ({
                            ...prev,
                            [szene.id]: {
                              ...prev[szene.id],
                              status: e.target.value as SzenenProbenStatus | '',
                            },
                          }))
                        }
                        className="rounded border border-gray-300 px-2 py-1 text-sm"
                      >
                        <option value="">Status...</option>
                        {Object.entries(STATUS_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() =>
                              setSzenenNotizen((prev) => ({
                                ...prev,
                                [szene.id]: {
                                  ...prev[szene.id],
                                  fortschritt:
                                    prev[szene.id]?.fortschritt === star
                                      ? 0
                                      : star,
                                },
                              }))
                            }
                            className={`h-5 w-5 ${
                              (szenenNotizen[szene.id]?.fortschritt || 0) >= star
                                ? 'text-amber-400'
                                : 'text-gray-300'
                            }`}
                          >
                            <svg fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <textarea
                    value={szenenNotizen[szene.id]?.notizen || ''}
                    onChange={(e) =>
                      setSzenenNotizen((prev) => ({
                        ...prev,
                        [szene.id]: {
                          ...prev[szene.id],
                          notizen: e.target.value,
                        },
                      }))
                    }
                    rows={2}
                    placeholder="Notizen zur Szene..."
                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              ))}
          </div>
        </div>
      )}

      {/* General Notes */}
      <div className="rounded-lg bg-white p-4 shadow">
        <h3 className="mb-3 font-medium text-gray-900">Allgemeine Notizen</h3>
        <textarea
          value={allgemeineNotizen}
          onChange={(e) => setAllgemeineNotizen(e.target.value)}
          rows={4}
          placeholder="Allgemeine Notizen zur Probe..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
        />
      </div>

      {/* Tasks */}
      {protokoll && (
        <div className="rounded-lg bg-white p-4 shadow">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Aufgaben</h3>
            <button
              type="button"
              onClick={() => setShowTaskForm(!showTaskForm)}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              + Aufgabe hinzufuegen
            </button>
          </div>

          {showTaskForm && (
            <div className="mb-4 rounded-lg border border-gray-200 p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    value={newTask.titel}
                    onChange={(e) =>
                      setNewTask((prev) => ({ ...prev, titel: e.target.value }))
                    }
                    placeholder="Aufgabe..."
                    className="w-full rounded border border-gray-300 px-3 py-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <select
                  value={newTask.zustaendig_id}
                  onChange={(e) =>
                    setNewTask((prev) => ({
                      ...prev,
                      zustaendig_id: e.target.value,
                    }))
                  }
                  className="rounded border border-gray-300 px-3 py-2"
                >
                  <option value="">Zuständig...</option>
                  {teilnehmer.map((t) => (
                    <option key={t.person.id} value={t.person.id}>
                      {t.person.vorname} {t.person.nachname}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  value={newTask.faellig_bis}
                  onChange={(e) =>
                    setNewTask((prev) => ({
                      ...prev,
                      faellig_bis: e.target.value,
                    }))
                  }
                  className="rounded border border-gray-300 px-3 py-2"
                />
                <select
                  value={newTask.prioritaet}
                  onChange={(e) =>
                    setNewTask((prev) => ({
                      ...prev,
                      prioritaet: e.target.value as AufgabenPrioritaet,
                    }))
                  }
                  className="rounded border border-gray-300 px-3 py-2"
                >
                  {Object.entries(PRIORITAET_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAddTask}
                    disabled={!newTask.titel || isLoading}
                    className="rounded bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
                  >
                    Hinzufuegen
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTaskForm(false)}
                    className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            </div>
          )}

          {protokoll.aufgaben && protokoll.aufgaben.length > 0 ? (
            <ul className="divide-y divide-gray-100">
              {protokoll.aufgaben.map((aufgabe) => {
                const zustaendig = aufgabe.zustaendig as unknown as {
                  vorname: string
                  nachname: string
                } | null
                return (
                  <li key={aufgabe.id} className="flex items-start gap-3 py-2">
                    <input
                      type="checkbox"
                      checked={aufgabe.status === 'erledigt'}
                      onChange={(e) =>
                        handleTaskStatusChange(
                          aufgabe.id,
                          e.target.checked ? 'erledigt' : 'offen'
                        )
                      }
                      className="mt-1 rounded border-gray-300"
                    />
                    <div className="min-w-0 flex-1">
                      <div
                        className={`font-medium ${
                          aufgabe.status === 'erledigt'
                            ? 'text-gray-400 line-through'
                            : 'text-gray-900'
                        }`}
                      >
                        {aufgabe.titel}
                      </div>
                      <div className="mt-0.5 flex flex-wrap gap-2 text-xs text-gray-500">
                        {zustaendig && (
                          <span>
                            {zustaendig.vorname} {zustaendig.nachname}
                          </span>
                        )}
                        {aufgabe.faellig_bis && (
                          <span>
                            bis{' '}
                            {new Date(aufgabe.faellig_bis).toLocaleDateString(
                              'de-CH'
                            )}
                          </span>
                        )}
                        <span
                          className={`rounded px-1 ${
                            aufgabe.prioritaet === 'dringend'
                              ? 'bg-error-100 text-error-700'
                              : aufgabe.prioritaet === 'hoch'
                                ? 'bg-warning-100 text-warning-700'
                                : ''
                          }`}
                        >
                          {PRIORITAET_LABELS[aufgabe.prioritaet]}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteTask(aufgabe.id)}
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
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">Noch keine Aufgaben</p>
          )}
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={isLoading}
          className="rounded-lg bg-primary-600 px-6 py-2 font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {isLoading ? 'Speichert...' : 'Protokoll speichern'}
        </button>
      </div>
    </div>
  )
}
