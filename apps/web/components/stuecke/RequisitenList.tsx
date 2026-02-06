'use client'

import { useState } from 'react'
import type {
  RequisiteMitDetails,
  RequisiteInsert,
  RequisitenStatus,
  Szene,
  Person,
} from '@/lib/supabase/types'
import { REQUISITEN_STATUS_LABELS } from '@/lib/supabase/types'
import {
  createRequisite,
  updateRequisite,
  deleteRequisite,
  updateRequisitenStatus,
} from '@/lib/actions/requisiten'
import { Package, User, Film, Check, Search, ShoppingCart, Archive } from 'lucide-react'

interface RequisitenListProps {
  stueckId: string
  requisiten: RequisiteMitDetails[]
  szenen: Pick<Szene, 'id' | 'nummer' | 'titel'>[]
  personen: Pick<Person, 'id' | 'vorname' | 'nachname'>[]
  canEdit: boolean
}

const STATUS_COLORS: Record<RequisitenStatus, string> = {
  gesucht: 'bg-error-100 text-error-800',
  gefunden: 'bg-warning-100 text-warning-800',
  beschafft: 'bg-info-100 text-info-800',
  vorhanden: 'bg-success-100 text-success-800',
}

const STATUS_ICONS: Record<RequisitenStatus, React.ReactNode> = {
  gesucht: <Search className="h-3 w-3" />,
  gefunden: <Check className="h-3 w-3" />,
  beschafft: <ShoppingCart className="h-3 w-3" />,
  vorhanden: <Archive className="h-3 w-3" />,
}

export function RequisitenList({
  stueckId,
  requisiten,
  szenen,
  personen,
  canEdit,
}: RequisitenListProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [newRequisite, setNewRequisite] = useState<Partial<RequisiteInsert>>({
    name: '',
    beschreibung: '',
    szene_id: null,
    verantwortlich_id: null,
    status: 'gesucht',
    notizen: '',
  })

  const handleAdd = async () => {
    if (!newRequisite.name?.trim()) {
      setError('Name ist erforderlich')
      return
    }

    setIsSubmitting(true)
    setError(null)
    try {
      const result = await createRequisite({
        stueck_id: stueckId,
        name: newRequisite.name.trim(),
        beschreibung: newRequisite.beschreibung?.trim() || null,
        szene_id: newRequisite.szene_id || null,
        verantwortlich_id: newRequisite.verantwortlich_id || null,
        status: newRequisite.status || 'gesucht',
        notizen: newRequisite.notizen?.trim() || null,
      })
      if (result.success) {
        setIsAdding(false)
        setNewRequisite({
          name: '',
          beschreibung: '',
          szene_id: null,
          verantwortlich_id: null,
          status: 'gesucht',
          notizen: '',
        })
      } else {
        setError(result.error || 'Fehler beim Erstellen')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStatusChange = async (id: string, status: RequisitenStatus) => {
    setIsSubmitting(true)
    setError(null)
    try {
      const result = await updateRequisitenStatus(id, status)
      if (!result.success) {
        setError(result.error || 'Fehler beim Aktualisieren')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Requisite wirklich löschen?')) return
    setIsSubmitting(true)
    try {
      const result = await deleteRequisite(id)
      if (!result.success) {
        setError(result.error || 'Fehler beim Löschen')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Group by status for overview
  const grouped = {
    gesucht: requisiten.filter((r) => r.status === 'gesucht'),
    gefunden: requisiten.filter((r) => r.status === 'gefunden'),
    beschafft: requisiten.filter((r) => r.status === 'beschafft'),
    vorhanden: requisiten.filter((r) => r.status === 'vorhanden'),
  }

  return (
    <div className="rounded-lg bg-white shadow">
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Requisiten</h2>
          <span className="ml-2 rounded-full bg-gray-100 px-2.5 py-0.5 text-sm text-gray-600">
            {requisiten.length}
          </span>
        </div>
        {canEdit && !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="text-sm text-primary-600 hover:text-primary-800"
          >
            + Requisite hinzufügen
          </button>
        )}
      </div>

      {/* Status Overview */}
      {requisiten.length > 0 && (
        <div className="grid grid-cols-4 gap-2 border-b border-gray-200 px-6 py-3">
          {(Object.keys(grouped) as RequisitenStatus[]).map((status) => (
            <div
              key={status}
              className={`flex items-center justify-center gap-1 rounded-lg px-2 py-1 text-xs ${STATUS_COLORS[status]}`}
            >
              {STATUS_ICONS[status]}
              <span>{grouped[status].length}</span>
              <span className="hidden sm:inline">{REQUISITEN_STATUS_LABELS[status]}</span>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="mx-6 mt-4 rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
          {error}
        </div>
      )}

      <ul className="divide-y divide-gray-200">
        {requisiten.map((requisite) => (
          <li key={requisite.id} className="px-6 py-4">
            {editingId === requisite.id ? (
              <RequisiteEditRow
                requisite={requisite}
                szenen={szenen}
                personen={personen}
                onSave={async (data) => {
                  setIsSubmitting(true)
                  const result = await updateRequisite(requisite.id, data)
                  setIsSubmitting(false)
                  if (result.success) {
                    setEditingId(null)
                  } else {
                    setError(result.error || 'Fehler beim Aktualisieren')
                  }
                }}
                onCancel={() => setEditingId(null)}
                isSubmitting={isSubmitting}
              />
            ) : (
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{requisite.name}</span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[requisite.status]}`}
                    >
                      {STATUS_ICONS[requisite.status]}
                      {REQUISITEN_STATUS_LABELS[requisite.status]}
                    </span>
                  </div>
                  {requisite.beschreibung && (
                    <p className="mt-1 text-sm text-gray-500">{requisite.beschreibung}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500">
                    {requisite.szene && (
                      <span className="flex items-center gap-1">
                        <Film className="h-3 w-3" />
                        Szene {requisite.szene.nummer}: {requisite.szene.titel}
                      </span>
                    )}
                    {requisite.verantwortlich && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {requisite.verantwortlich.vorname} {requisite.verantwortlich.nachname}
                      </span>
                    )}
                  </div>
                  {requisite.notizen && (
                    <p className="mt-2 rounded bg-gray-50 px-2 py-1 text-xs text-gray-600">
                      {requisite.notizen}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* Quick status change dropdown */}
                  <select
                    value={requisite.status}
                    onChange={(e) =>
                      handleStatusChange(requisite.id, e.target.value as RequisitenStatus)
                    }
                    disabled={isSubmitting}
                    className="rounded border border-gray-300 px-2 py-1 text-xs focus:ring-2 focus:ring-primary-500"
                  >
                    {(Object.keys(REQUISITEN_STATUS_LABELS) as RequisitenStatus[]).map((s) => (
                      <option key={s} value={s}>
                        {REQUISITEN_STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>
                  {canEdit && (
                    <>
                      <button
                        onClick={() => setEditingId(requisite.id)}
                        className="text-xs text-gray-600 hover:text-gray-900"
                      >
                        Bearbeiten
                      </button>
                      <button
                        onClick={() => handleDelete(requisite.id)}
                        className="text-xs text-error-600 hover:text-error-800"
                      >
                        Löschen
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </li>
        ))}

        {isAdding && (
          <li className="bg-gray-50 px-6 py-4">
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Name der Requisite *"
                value={newRequisite.name}
                onChange={(e) => setNewRequisite({ ...newRequisite, name: e.target.value })}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
              />
              <input
                type="text"
                placeholder="Beschreibung (optional)"
                value={newRequisite.beschreibung ?? ''}
                onChange={(e) =>
                  setNewRequisite({ ...newRequisite, beschreibung: e.target.value })
                }
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <select
                  value={newRequisite.szene_id ?? ''}
                  onChange={(e) =>
                    setNewRequisite({
                      ...newRequisite,
                      szene_id: e.target.value || null,
                    })
                  }
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Szene (optional)</option>
                  {szenen.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nummer}. {s.titel}
                    </option>
                  ))}
                </select>
                <select
                  value={newRequisite.verantwortlich_id ?? ''}
                  onChange={(e) =>
                    setNewRequisite({
                      ...newRequisite,
                      verantwortlich_id: e.target.value || null,
                    })
                  }
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Verantwortlich (optional)</option>
                  {personen.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.vorname} {p.nachname}
                    </option>
                  ))}
                </select>
                <select
                  value={newRequisite.status ?? 'gesucht'}
                  onChange={(e) =>
                    setNewRequisite({
                      ...newRequisite,
                      status: e.target.value as RequisitenStatus,
                    })
                  }
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
                >
                  {(Object.keys(REQUISITEN_STATUS_LABELS) as RequisitenStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {REQUISITEN_STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                placeholder="Notizen (optional)"
                value={newRequisite.notizen ?? ''}
                onChange={(e) => setNewRequisite({ ...newRequisite, notizen: e.target.value })}
                rows={2}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsAdding(false)}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleAdd}
                  disabled={isSubmitting || !newRequisite.name?.trim()}
                  className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm text-white hover:bg-primary-700 disabled:bg-gray-400"
                >
                  {isSubmitting ? 'Speichern...' : 'Hinzufügen'}
                </button>
              </div>
            </div>
          </li>
        )}

        {requisiten.length === 0 && !isAdding && (
          <li className="px-6 py-8 text-center text-gray-500">
            Noch keine Requisiten erfasst
          </li>
        )}
      </ul>
    </div>
  )
}

interface RequisiteEditRowProps {
  requisite: RequisiteMitDetails
  szenen: Pick<Szene, 'id' | 'nummer' | 'titel'>[]
  personen: Pick<Person, 'id' | 'vorname' | 'nachname'>[]
  onSave: (data: Partial<RequisiteMitDetails>) => void
  onCancel: () => void
  isSubmitting: boolean
}

function RequisiteEditRow({
  requisite,
  szenen,
  personen,
  onSave,
  onCancel,
  isSubmitting,
}: RequisiteEditRowProps) {
  const [editData, setEditData] = useState({
    name: requisite.name,
    beschreibung: requisite.beschreibung ?? '',
    szene_id: requisite.szene_id ?? '',
    verantwortlich_id: requisite.verantwortlich_id ?? '',
    status: requisite.status,
    notizen: requisite.notizen ?? '',
  })

  return (
    <div className="space-y-3">
      <input
        type="text"
        value={editData.name}
        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
      />
      <input
        type="text"
        placeholder="Beschreibung"
        value={editData.beschreibung}
        onChange={(e) => setEditData({ ...editData, beschreibung: e.target.value })}
        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
      />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <select
          value={editData.szene_id}
          onChange={(e) => setEditData({ ...editData, szene_id: e.target.value })}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Keine Szene</option>
          {szenen.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nummer}. {s.titel}
            </option>
          ))}
        </select>
        <select
          value={editData.verantwortlich_id}
          onChange={(e) => setEditData({ ...editData, verantwortlich_id: e.target.value })}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Niemand verantwortlich</option>
          {personen.map((p) => (
            <option key={p.id} value={p.id}>
              {p.vorname} {p.nachname}
            </option>
          ))}
        </select>
        <select
          value={editData.status}
          onChange={(e) =>
            setEditData({ ...editData, status: e.target.value as RequisitenStatus })
          }
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
        >
          {(Object.keys(REQUISITEN_STATUS_LABELS) as RequisitenStatus[]).map((s) => (
            <option key={s} value={s}>
              {REQUISITEN_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
      </div>
      <textarea
        placeholder="Notizen"
        value={editData.notizen}
        onChange={(e) => setEditData({ ...editData, notizen: e.target.value })}
        rows={2}
        className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
      />
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
        >
          Abbrechen
        </button>
        <button
          onClick={() =>
            onSave({
              name: editData.name,
              beschreibung: editData.beschreibung || null,
              szene_id: editData.szene_id || null,
              verantwortlich_id: editData.verantwortlich_id || null,
              status: editData.status,
              notizen: editData.notizen || null,
            })
          }
          disabled={isSubmitting || !editData.name.trim()}
          className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm text-white hover:bg-primary-700 disabled:bg-gray-400"
        >
          {isSubmitting ? 'Speichern...' : 'Speichern'}
        </button>
      </div>
    </div>
  )
}
