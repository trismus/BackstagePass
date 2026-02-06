'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Lightbulb,
  ThumbsUp,
  AlertTriangle,
  Wrench,
  Plus,
  Trash2,
  Check,
  X,
} from 'lucide-react'
import {
  createLesson,
  updateLesson,
  deleteLesson,
} from '@/lib/actions/lessons-learned'
import type {
  LessonsLearnedMitDetails,
  LessonsLearnedKategorie,
  LessonsLearnedStatus,
  LessonsLearnedPrioritaet,
  Person,
} from '@/lib/supabase/types'
import {
  LESSONS_LEARNED_KATEGORIE_LABELS,
  LESSONS_LEARNED_STATUS_LABELS,
} from '@/lib/supabase/types'

interface LessonsLearnedManagerProps {
  veranstaltungId: string
  lessons: LessonsLearnedMitDetails[]
  personen: Pick<Person, 'id' | 'vorname' | 'nachname'>[]
  canEdit: boolean
}

const kategorieIcons: Record<LessonsLearnedKategorie, React.ReactNode> = {
  positiv: <ThumbsUp className="h-4 w-4 text-green-600" />,
  verbesserung: <Wrench className="h-4 w-4 text-blue-600" />,
  problem: <AlertTriangle className="h-4 w-4 text-red-600" />,
  idee: <Lightbulb className="h-4 w-4 text-amber-600" />,
}

const kategorieColors: Record<LessonsLearnedKategorie, string> = {
  positiv: 'border-green-200 bg-green-50',
  verbesserung: 'border-blue-200 bg-blue-50',
  problem: 'border-red-200 bg-red-50',
  idee: 'border-amber-200 bg-amber-50',
}

const statusColors: Record<LessonsLearnedStatus, string> = {
  offen: 'bg-gray-100 text-gray-700',
  in_bearbeitung: 'bg-blue-100 text-blue-700',
  erledigt: 'bg-green-100 text-green-700',
  verworfen: 'bg-gray-100 text-gray-400 line-through',
}

export function LessonsLearnedManager({
  veranstaltungId,
  lessons,
  personen,
  canEdit,
}: LessonsLearnedManagerProps) {
  const router = useRouter()
  const [showAddForm, setShowAddForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [newKategorie, setNewKategorie] = useState<LessonsLearnedKategorie>('positiv')
  const [newTitel, setNewTitel] = useState('')
  const [newBeschreibung, setNewBeschreibung] = useState('')
  const [newPrioritaet, setNewPrioritaet] = useState<LessonsLearnedPrioritaet | ''>('')
  const [newVerantwortlich, setNewVerantwortlich] = useState('')

  // Group by kategorie
  const groupedLessons = lessons.reduce(
    (acc, lesson) => {
      if (!acc[lesson.kategorie]) acc[lesson.kategorie] = []
      acc[lesson.kategorie].push(lesson)
      return acc
    },
    {} as Record<LessonsLearnedKategorie, LessonsLearnedMitDetails[]>
  )

  async function handleAdd() {
    if (!newTitel.trim()) {
      setError('Titel ist erforderlich')
      return
    }

    setLoading(true)
    setError(null)

    const result = await createLesson({
      veranstaltung_id: veranstaltungId,
      kategorie: newKategorie,
      titel: newTitel.trim(),
      beschreibung: newBeschreibung.trim() || null,
      prioritaet: newPrioritaet || null,
      status: 'offen',
      verantwortlich_id: newVerantwortlich || null,
    })

    if (result.success) {
      setShowAddForm(false)
      setNewTitel('')
      setNewBeschreibung('')
      setNewPrioritaet('')
      setNewVerantwortlich('')
      router.refresh()
    } else {
      setError(result.error || 'Fehler beim Erstellen')
    }
    setLoading(false)
  }

  async function handleStatusChange(id: string, status: LessonsLearnedStatus) {
    setLoading(true)
    const result = await updateLesson(id, { status })
    if (!result.success) {
      setError(result.error || 'Fehler beim Aktualisieren')
    } else {
      router.refresh()
    }
    setLoading(false)
  }

  async function handleDelete(id: string, titel: string) {
    if (!confirm(`"${titel}" wirklich loeschen?`)) return

    setLoading(true)
    const result = await deleteLesson(id)
    if (!result.success) {
      setError(result.error || 'Fehler beim Loeschen')
    } else {
      router.refresh()
    }
    setLoading(false)
  }

  // Summary stats
  const stats = {
    total: lessons.length,
    offen: lessons.filter((l) => l.status === 'offen' || l.status === 'in_bearbeitung').length,
    erledigt: lessons.filter((l) => l.status === 'erledigt').length,
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          <h2 className="text-lg font-bold text-gray-900">Lessons Learned</h2>
          {stats.total > 0 && (
            <span className="ml-2 text-sm text-gray-500">
              ({stats.offen} offen, {stats.erledigt} erledigt)
            </span>
          )}
        </div>
        {canEdit && !showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1 rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
          >
            <Plus className="h-4 w-4" />
            Hinzufuegen
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <h3 className="mb-3 font-medium text-gray-900">Neuer Eintrag</h3>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Kategorie */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Kategorie
              </label>
              <select
                value={newKategorie}
                onChange={(e) => setNewKategorie(e.target.value as LessonsLearnedKategorie)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              >
                {Object.entries(LESSONS_LEARNED_KATEGORIE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            {/* Prioritaet */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Prioritaet
              </label>
              <select
                value={newPrioritaet}
                onChange={(e) => setNewPrioritaet(e.target.value as LessonsLearnedPrioritaet | '')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              >
                <option value="">-- Keine --</option>
                <option value="niedrig">Niedrig</option>
                <option value="mittel">Mittel</option>
                <option value="hoch">Hoch</option>
              </select>
            </div>

            {/* Titel */}
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Titel *
              </label>
              <input
                type="text"
                value={newTitel}
                onChange={(e) => setNewTitel(e.target.value)}
                placeholder="Kurze Beschreibung..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Beschreibung */}
            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Details
              </label>
              <textarea
                value={newBeschreibung}
                onChange={(e) => setNewBeschreibung(e.target.value)}
                rows={3}
                placeholder="Detaillierte Beschreibung..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Verantwortlich */}
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Verantwortlich
              </label>
              <select
                value={newVerantwortlich}
                onChange={(e) => setNewVerantwortlich(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
              >
                <option value="">-- Niemand --</option>
                {personen.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.vorname} {p.nachname}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => {
                setShowAddForm(false)
                setNewTitel('')
                setNewBeschreibung('')
                setError(null)
              }}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Abbrechen
            </button>
            <button
              onClick={handleAdd}
              disabled={loading || !newTitel.trim()}
              className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700 disabled:bg-amber-400"
            >
              {loading ? 'Speichern...' : 'Hinzufuegen'}
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {lessons.length === 0 && !showAddForm && (
        <p className="py-8 text-center text-sm text-gray-500">
          Noch keine Erkenntnisse dokumentiert.
          {canEdit && ' Fuege welche hinzu um aus der Veranstaltung zu lernen.'}
        </p>
      )}

      {/* Lessons List by Category */}
      {(['positiv', 'problem', 'verbesserung', 'idee'] as LessonsLearnedKategorie[]).map(
        (kategorie) => {
          const items = groupedLessons[kategorie] || []
          if (items.length === 0) return null

          return (
            <div key={kategorie} className="mb-4 last:mb-0">
              <div className="mb-2 flex items-center gap-2">
                {kategorieIcons[kategorie]}
                <span className="text-sm font-medium text-gray-700">
                  {LESSONS_LEARNED_KATEGORIE_LABELS[kategorie]} ({items.length})
                </span>
              </div>

              <div className="space-y-2">
                {items.map((lesson) => (
                  <div
                    key={lesson.id}
                    className={`rounded-lg border p-3 ${kategorieColors[kategorie]} ${
                      lesson.status === 'verworfen' ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-medium ${
                              lesson.status === 'verworfen' ? 'line-through' : ''
                            }`}
                          >
                            {lesson.titel}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              statusColors[lesson.status]
                            }`}
                          >
                            {LESSONS_LEARNED_STATUS_LABELS[lesson.status]}
                          </span>
                          {lesson.prioritaet === 'hoch' && (
                            <span className="rounded bg-red-600 px-1.5 py-0.5 text-xs font-bold text-white">
                              !
                            </span>
                          )}
                        </div>
                        {lesson.beschreibung && (
                          <p className="mt-1 text-sm text-gray-600">{lesson.beschreibung}</p>
                        )}
                        {lesson.verantwortlich && (
                          <p className="mt-1 text-xs text-gray-500">
                            Verantwortlich: {lesson.verantwortlich.vorname}{' '}
                            {lesson.verantwortlich.nachname}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      {canEdit && lesson.status !== 'erledigt' && lesson.status !== 'verworfen' && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleStatusChange(lesson.id, 'erledigt')}
                            disabled={loading}
                            title="Als erledigt markieren"
                            className="rounded p-1 text-green-600 hover:bg-green-100 disabled:opacity-50"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleStatusChange(lesson.id, 'verworfen')}
                            disabled={loading}
                            title="Verwerfen"
                            className="rounded p-1 text-gray-500 hover:bg-gray-200 disabled:opacity-50"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(lesson.id, lesson.titel)}
                            disabled={loading}
                            title="Loeschen"
                            className="rounded p-1 text-red-600 hover:bg-red-100 disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        }
      )}
    </div>
  )
}
