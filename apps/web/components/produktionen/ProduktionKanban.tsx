'use client'

import { useState } from 'react'
import type { Produktion, ProduktionStatus } from '@/lib/supabase/types'
import { PRODUKTION_STATUS_LABELS } from '@/lib/supabase/types'
import { ALLOWED_TRANSITIONS } from '@/lib/produktionen-utils'
import { updateProduktionStatus } from '@/lib/actions/produktionen'
import { ProduktionCard } from './ProduktionCard'

const KANBAN_COLUMNS: ProduktionStatus[] = [
  'draft',
  'planung',
  'casting',
  'proben',
  'premiere',
  'laufend',
  'abgeschlossen',
  'abgesagt',
]

const COLUMN_COLORS: Record<ProduktionStatus, string> = {
  draft: 'border-t-gray-400',
  planung: 'border-t-blue-400',
  casting: 'border-t-amber-400',
  proben: 'border-t-indigo-400',
  premiere: 'border-t-purple-400',
  laufend: 'border-t-green-400',
  abgeschlossen: 'border-t-gray-300',
  abgesagt: 'border-t-red-400',
}

interface ProduktionKanbanProps {
  produktionen: Produktion[]
  canEdit?: boolean
}

export function ProduktionKanban({
  produktionen,
  canEdit = false,
}: ProduktionKanbanProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<ProduktionStatus | null>(
    null
  )
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saisonFilter, setSaisonFilter] = useState<string>('alle')

  const saisons = [
    ...new Set(produktionen.map((p) => p.saison)),
  ].sort()

  const filtered =
    saisonFilter === 'alle'
      ? produktionen
      : produktionen.filter((p) => p.saison === saisonFilter)

  const grouped = KANBAN_COLUMNS.reduce(
    (acc, status) => {
      acc[status] = filtered.filter((p) => p.status === status)
      return acc
    },
    {} as Record<ProduktionStatus, Produktion[]>
  )

  const getDraggedProduktion = () =>
    produktionen.find((p) => p.id === draggedId) || null

  const isValidDrop = (targetStatus: ProduktionStatus) => {
    if (!canEdit || !draggedId) return false
    const produktion = getDraggedProduktion()
    if (!produktion || produktion.status === targetStatus) return false
    return ALLOWED_TRANSITIONS[produktion.status].includes(targetStatus)
  }

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, status: ProduktionStatus) => {
    e.preventDefault()
    if (isValidDrop(status)) {
      e.dataTransfer.dropEffect = 'move'
      setDragOverColumn(status)
    } else {
      e.dataTransfer.dropEffect = 'none'
    }
  }

  const handleDragLeave = () => {
    setDragOverColumn(null)
  }

  const handleDrop = async (
    e: React.DragEvent,
    targetStatus: ProduktionStatus
  ) => {
    e.preventDefault()
    setDragOverColumn(null)

    if (!draggedId || !isValidDrop(targetStatus)) {
      setDraggedId(null)
      return
    }

    setIsUpdating(true)
    setError(null)

    const result = await updateProduktionStatus(draggedId, targetStatus)
    if (!result.success) {
      setError(result.error || 'Fehler beim Status-Update')
    }

    setDraggedId(null)
    setIsUpdating(false)
  }

  const handleDragEnd = () => {
    setDraggedId(null)
    setDragOverColumn(null)
  }

  return (
    <div className="space-y-4">
      {/* Saison Filter */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">Saison:</label>
        <select
          value={saisonFilter}
          onChange={(e) => setSaisonFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500"
        >
          <option value="alle">Alle Saisons</option>
          {saisons.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <span className="text-sm text-gray-500">
          {filtered.length} Produktionen
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-700">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 font-medium underline"
          >
            Schliessen
          </button>
        </div>
      )}

      {/* Loading overlay indicator */}
      {isUpdating && (
        <div className="rounded-lg bg-blue-50 p-2 text-center text-sm text-blue-700">
          Status wird aktualisiert...
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((status) => {
          const items = grouped[status]
          const isOver = dragOverColumn === status
          const isValid = isValidDrop(status)

          return (
            <div
              key={status}
              className={`flex w-64 min-w-[16rem] flex-shrink-0 flex-col rounded-lg border-t-4 bg-gray-50 ${COLUMN_COLORS[status]} ${
                isOver && isValid
                  ? 'ring-2 ring-primary-400 ring-offset-2'
                  : ''
              } ${isOver && !isValid ? 'opacity-50' : ''}`}
              onDragOver={(e) => handleDragOver(e, status)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, status)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between px-3 py-2">
                <h3 className="text-sm font-semibold text-gray-700">
                  {PRODUKTION_STATUS_LABELS[status]}
                </h3>
                <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600">
                  {items.length}
                </span>
              </div>

              {/* Cards */}
              <div className="flex flex-1 flex-col gap-2 px-2 pb-2">
                {items.length === 0 ? (
                  <div className="rounded-lg border-2 border-dashed border-gray-200 p-4 text-center text-xs text-gray-400">
                    Keine Produktionen
                  </div>
                ) : (
                  items.map((p) => (
                    <div
                      key={p.id}
                      className={
                        draggedId === p.id ? 'opacity-50' : ''
                      }
                      onDragEnd={handleDragEnd}
                    >
                      <ProduktionCard
                        produktion={p}
                        draggable={canEdit}
                        onDragStart={handleDragStart}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
