'use client'

import { useState } from 'react'
import type { Verfuegbarkeit } from '@/lib/supabase/types'
import { WIEDERHOLUNG_TYP_LABELS } from '@/lib/supabase/types'
import { VerfuegbarkeitBadge } from './VerfuegbarkeitBadge'
import { VerfuegbarkeitForm } from './VerfuegbarkeitForm'

interface VerfuegbarkeitListeProps {
  mitgliedId: string
  verfuegbarkeiten: Verfuegbarkeit[]
  readOnly?: boolean
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatTime(timeStr: string | null): string {
  if (!timeStr) return ''
  return timeStr.slice(0, 5) // HH:MM
}

function formatDateRange(von: string, bis: string): string {
  if (von === bis) {
    return formatDate(von)
  }
  return `${formatDate(von)} - ${formatDate(bis)}`
}

export function VerfuegbarkeitListe({
  mitgliedId,
  verfuegbarkeiten,
  readOnly = false,
}: VerfuegbarkeitListeProps) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const handleSuccess = () => {
    setShowForm(false)
    setEditingId(null)
  }

  const editingEntry = editingId
    ? verfuegbarkeiten.find((v) => v.id === editingId)
    : undefined

  // Split into past and upcoming
  const today = new Date().toISOString().split('T')[0]
  const upcoming = verfuegbarkeiten.filter((v) => v.datum_bis >= today)
  const past = verfuegbarkeiten.filter((v) => v.datum_bis < today)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-neutral-900">
          Verfügbarkeiten
        </h3>
        {!readOnly && !showForm && !editingId && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            + Neuer Eintrag
          </button>
        )}
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h4 className="mb-4 font-medium text-neutral-900">
            Neue Verfügbarkeit eintragen
          </h4>
          <VerfuegbarkeitForm
            mitgliedId={mitgliedId}
            onSuccess={handleSuccess}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Edit Form */}
      {editingId && editingEntry && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h4 className="mb-4 font-medium text-neutral-900">
            Verfügbarkeit bearbeiten
          </h4>
          <VerfuegbarkeitForm
            mitgliedId={mitgliedId}
            verfuegbarkeit={editingEntry}
            onSuccess={handleSuccess}
            onCancel={() => setEditingId(null)}
          />
        </div>
      )}

      {/* Upcoming List */}
      {upcoming.length > 0 && (
        <div>
          <h4 className="mb-3 text-sm font-medium text-neutral-500">
            Aktuelle & kommende Einträge
          </h4>
          <div className="space-y-2">
            {upcoming.map((v) => (
              <VerfuegbarkeitCard
                key={v.id}
                verfuegbarkeit={v}
                onEdit={
                  !readOnly && !showForm && !editingId
                    ? () => setEditingId(v.id)
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Past List (collapsed) */}
      {past.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-sm font-medium text-neutral-500 hover:text-neutral-700">
            Vergangene Einträge ({past.length})
          </summary>
          <div className="mt-3 space-y-2">
            {past.map((v) => (
              <VerfuegbarkeitCard
                key={v.id}
                verfuegbarkeit={v}
                isPast
              />
            ))}
          </div>
        </details>
      )}

      {/* Empty State */}
      {verfuegbarkeiten.length === 0 && !showForm && (
        <p className="py-8 text-center text-neutral-500">
          Keine Verfügbarkeiten eingetragen
        </p>
      )}
    </div>
  )
}

// Individual card component
function VerfuegbarkeitCard({
  verfuegbarkeit,
  onEdit,
  isPast = false,
}: {
  verfuegbarkeit: Verfuegbarkeit
  onEdit?: () => void
  isPast?: boolean
}) {
  const hasTimeWindow =
    verfuegbarkeit.zeitfenster_von && verfuegbarkeit.zeitfenster_bis

  return (
    <div
      className={`rounded-lg border p-4 ${
        isPast
          ? 'border-neutral-200 bg-neutral-50 opacity-60'
          : 'border-neutral-200 bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-3">
            <VerfuegbarkeitBadge status={verfuegbarkeit.status} />
            {verfuegbarkeit.wiederholung !== 'keine' && (
              <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                {WIEDERHOLUNG_TYP_LABELS[verfuegbarkeit.wiederholung]}
              </span>
            )}
          </div>

          <p className="font-medium text-neutral-900">
            {formatDateRange(
              verfuegbarkeit.datum_von,
              verfuegbarkeit.datum_bis
            )}
          </p>

          {hasTimeWindow && (
            <p className="text-sm text-neutral-600">
              {formatTime(verfuegbarkeit.zeitfenster_von)} -{' '}
              {formatTime(verfuegbarkeit.zeitfenster_bis)} Uhr
            </p>
          )}

          {verfuegbarkeit.grund && (
            <p className="mt-1 text-sm text-neutral-600">
              Grund: {verfuegbarkeit.grund}
            </p>
          )}

          {verfuegbarkeit.notiz && (
            <p className="mt-1 text-sm italic text-neutral-500">
              {verfuegbarkeit.notiz}
            </p>
          )}
        </div>

        {onEdit && (
          <button
            onClick={onEdit}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Bearbeiten
          </button>
        )}
      </div>
    </div>
  )
}
