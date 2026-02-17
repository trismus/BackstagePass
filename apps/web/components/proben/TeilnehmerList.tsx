'use client'

import { useState, useEffect } from 'react'
import type {
  ProbeTeilnehmer,
  Person,
  TeilnehmerStatus,
  PersonConflict,
  TeilnehmerSuggestionResult,
} from '@/lib/supabase/types'
import {
  updateTeilnehmerStatus,
  addTeilnehmerToProbe,
  removeTeilnehmerFromProbe,
  suggestProbenTeilnehmer,
  confirmProbenTeilnehmer,
} from '@/lib/actions/proben'
import { checkPersonConflicts } from '@/lib/actions/conflict-check'
import { TeilnehmerStatusBadge } from './ProbeStatusBadge'
import { TeilnehmerPreviewDialog } from './TeilnehmerPreviewDialog'
import { ConfirmDialog } from '@/components/ui'
import { ConflictWarning } from '@/components/ui/ConflictWarning'

interface TeilnehmerListProps {
  probeId: string
  teilnehmer: (ProbeTeilnehmer & {
    person: {
      id: string
      vorname: string
      nachname: string
      email: string | null
    }
  })[]
  personen: Person[]
  canEdit: boolean
  hasSzenen: boolean
  datum: string
  startzeit: string | null
  endzeit: string | null
}

const statusOptions: { value: TeilnehmerStatus; label: string }[] = [
  { value: 'eingeladen', label: 'Eingeladen' },
  { value: 'zugesagt', label: 'Zugesagt' },
  { value: 'vielleicht', label: 'Vielleicht' },
  { value: 'abgesagt', label: 'Abgesagt' },
  { value: 'erschienen', label: 'Erschienen' },
  { value: 'nicht_erschienen', label: 'Nicht erschienen' },
]

export function TeilnehmerList({
  probeId,
  teilnehmer,
  personen,
  canEdit,
  hasSzenen: _hasSzenen,
  datum,
  startzeit,
  endzeit,
}: TeilnehmerListProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedPersonId, setSelectedPersonId] = useState('')
  const [conflicts, setConflicts] = useState<PersonConflict[]>([])
  const [isCheckingConflicts, setIsCheckingConflicts] = useState(false)
  const [removeConfirm, setRemoveConfirm] = useState<{
    open: boolean
    personId: string
    name: string
  }>({ open: false, personId: '', name: '' })
  const [preview, setPreview] = useState<TeilnehmerSuggestionResult | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isConfirmingBulk, setIsConfirmingBulk] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)

  // Check conflicts when person is selected
  useEffect(() => {
    if (!selectedPersonId || !isAdding || !startzeit || !endzeit) {
      setConflicts([])
      return
    }

    const startTimestamp = `${datum}T${startzeit}`
    const endTimestamp = `${datum}T${endzeit}`

    let cancelled = false
    setIsCheckingConflicts(true)

    checkPersonConflicts(selectedPersonId, startTimestamp, endTimestamp)
      .then((result) => {
        if (!cancelled) {
          setConflicts(result.conflicts)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setConflicts([])
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsCheckingConflicts(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [selectedPersonId, isAdding, datum, startzeit, endzeit])

  // Personen die noch nicht eingeladen sind
  const teilnehmerIds = teilnehmer.map((t) => t.person_id)
  const availablePersonen = personen.filter(
    (p) => !teilnehmerIds.includes(p.id) && p.aktiv
  )

  const handleStatusChange = async (
    personId: string,
    status: TeilnehmerStatus
  ) => {
    setIsSubmitting(true)
    try {
      await updateTeilnehmerStatus(probeId, personId, status)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAdd = async () => {
    if (!selectedPersonId) return
    setIsSubmitting(true)
    try {
      await addTeilnehmerToProbe({
        probe_id: probeId,
        person_id: selectedPersonId,
        status: 'eingeladen',
        notizen: null,
      })
      setSelectedPersonId('')
      setIsAdding(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveClick = (personId: string, name: string) => {
    setRemoveConfirm({ open: true, personId, name })
  }

  const handleRemoveConfirm = async () => {
    setRemoveConfirm({ open: false, personId: '', name: '' })
    setIsSubmitting(true)
    try {
      await removeTeilnehmerFromProbe(probeId, removeConfirm.personId)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGenerateFromBesetzungen = async () => {
    setIsGenerating(true)
    setGenerateError(null)
    try {
      const result = await suggestProbenTeilnehmer(probeId)
      if (result.success && result.data) {
        setPreview(result.data)
      } else {
        setGenerateError(result.error || 'Fehler beim Generieren der Vorschläge.')
      }
    } catch {
      setGenerateError('Unerwarteter Fehler beim Generieren.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleConfirmBulk = async (personIds: string[]) => {
    setIsConfirmingBulk(true)
    try {
      const result = await confirmProbenTeilnehmer(probeId, personIds)
      if (result.success) {
        setPreview(null)
      } else {
        setGenerateError(result.error || 'Fehler beim Einladen.')
      }
    } finally {
      setIsConfirmingBulk(false)
    }
  }

  // Gruppiere nach Status
  const groupedByStatus: Record<TeilnehmerStatus, typeof teilnehmer> = {
    zugesagt: [],
    vielleicht: [],
    eingeladen: [],
    abgesagt: [],
    erschienen: [],
    nicht_erschienen: [],
  }
  teilnehmer.forEach((t) => {
    groupedByStatus[t.status].push(t)
  })

  const zusagenCount =
    groupedByStatus.zugesagt.length + groupedByStatus.erschienen.length
  const vielleichtCount = groupedByStatus.vielleicht.length
  const absagenCount =
    groupedByStatus.abgesagt.length + groupedByStatus.nicht_erschienen.length
  const offenCount = groupedByStatus.eingeladen.length

  return (
    <div className="rounded-lg bg-white shadow">
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Teilnehmer</h2>
            <p className="text-sm text-gray-500">
              {teilnehmer.length} eingeladen
              {zusagenCount > 0 && (
                <span className="text-success-600">
                  {' '}
                  · {zusagenCount} zugesagt
                </span>
              )}
              {vielleichtCount > 0 && (
                <span className="text-warning-600">
                  {' '}
                  · {vielleichtCount} vielleicht
                </span>
              )}
              {offenCount > 0 && (
                <span className="text-gray-500">
                  {' '}
                  · {offenCount} offen
                </span>
              )}
              {absagenCount > 0 && (
                <span className="text-error-600">
                  {' '}
                  · {absagenCount} abgesagt
                </span>
              )}
            </p>
          </div>
          {canEdit && (
            <div className="flex gap-2">
              <button
                onClick={handleGenerateFromBesetzungen}
                disabled={isSubmitting || isGenerating}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50"
                title="Teilnehmer aus Besetzungen vorschlagen"
              >
                {isGenerating ? 'Wird geladen...' : 'Aus Besetzungen'}
              </button>
              <button
                onClick={() => setIsAdding(true)}
                className="px-3 py-1.5 text-sm text-primary-600 hover:text-primary-800"
              >
                + Hinzufügen
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Generate Error */}
      {generateError && (
        <div className="border-b border-error-100 bg-error-50 px-6 py-3 text-sm text-error-700">
          {generateError}
        </div>
      )}

      {/* Add Teilnehmer Form */}
      {isAdding && (
        <div className="border-b border-blue-100 bg-blue-50 px-6 py-4">
          <div className="space-y-2">
            <div className="flex gap-3">
              <select
                value={selectedPersonId}
                onChange={(e) => setSelectedPersonId(e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Person auswählen...</option>
                {availablePersonen.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.vorname} {p.nachname}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAdd}
                disabled={isSubmitting || !selectedPersonId}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700 disabled:bg-gray-400"
              >
                Einladen
              </button>
              <button
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              >
                Abbrechen
              </button>
            </div>
            <ConflictWarning
              conflicts={conflicts}
              isLoading={isCheckingConflicts}
            />
          </div>
        </div>
      )}

      {/* Teilnehmer Liste */}
      <div className="divide-y divide-gray-200">
        {teilnehmer.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-500">
            Noch keine Teilnehmer eingeladen
          </div>
        ) : (
          teilnehmer.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between px-6 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700">
                  {t.person.vorname[0]}
                  {t.person.nachname[0]}
                </div>
                <div>
                  <span className="font-medium text-gray-900">
                    {t.person.vorname} {t.person.nachname}
                  </span>
                  {t.person.email && (
                    <span className="ml-2 text-sm text-gray-500">
                      {t.person.email}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                {canEdit ? (
                  <>
                    <select
                      value={t.status}
                      onChange={(e) =>
                        handleStatusChange(
                          t.person_id,
                          e.target.value as TeilnehmerStatus
                        )
                      }
                      disabled={isSubmitting}
                      className="rounded border border-gray-300 px-2 py-1 text-sm"
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() =>
                        handleRemoveClick(
                          t.person_id,
                          `${t.person.vorname} ${t.person.nachname}`
                        )
                      }
                      className="hover:text-error-800 text-sm text-error-600"
                    >
                      Entfernen
                    </button>
                  </>
                ) : (
                  <TeilnehmerStatusBadge status={t.status} />
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <ConfirmDialog
        open={removeConfirm.open}
        title="Teilnehmer entfernen"
        message={`${removeConfirm.name} wirklich von der Probe entfernen?`}
        confirmLabel="Entfernen"
        cancelLabel="Abbrechen"
        variant="danger"
        onConfirm={handleRemoveConfirm}
        onCancel={() => setRemoveConfirm({ open: false, personId: '', name: '' })}
      />

      {preview && (
        <TeilnehmerPreviewDialog
          open={!!preview}
          onClose={() => setPreview(null)}
          preview={preview}
          onConfirm={handleConfirmBulk}
          isConfirming={isConfirmingBulk}
        />
      )}
    </div>
  )
}
