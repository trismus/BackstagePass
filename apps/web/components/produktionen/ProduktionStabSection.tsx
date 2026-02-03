'use client'

import { useState } from 'react'
import type {
  Person,
  StabFunktion,
  StabKategorie,
  StabMitgliedMitDetails,
} from '@/lib/supabase/types'
import { STAB_KATEGORIE_LABELS } from '@/lib/supabase/types'
import {
  createStabMitglied,
  deleteStabMitglied,
  updateStabMitglied,
} from '@/lib/actions/produktions-stab'

const KATEGORIE_ORDER: StabKategorie[] = [
  'kuenstlerisch',
  'technisch',
  'organisation',
]

interface ProduktionStabSectionProps {
  produktionId: string
  stab: StabMitgliedMitDetails[]
  funktionen: StabFunktion[]
  personen: Pick<Person, 'id' | 'vorname' | 'nachname'>[]
  canEdit: boolean
}

export function ProduktionStabSection({
  produktionId,
  stab,
  funktionen,
  personen,
  canEdit,
}: ProduktionStabSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isExtern, setIsExtern] = useState(false)

  const [newEntry, setNewEntry] = useState({
    funktion: '',
    person_id: '',
    externer_name: '',
    externer_kontakt: '',
    ist_leitung: false,
    notizen: '',
  })

  // Group funktionen by kategorie for the dropdown
  const funktionenByKategorie = KATEGORIE_ORDER.map((kat) => ({
    kategorie: kat,
    label: STAB_KATEGORIE_LABELS[kat],
    funktionen: funktionen.filter((f) => f.kategorie === kat),
  }))

  // Group stab by kategorie based on funktion name match
  const funktionKategorieMap = new Map(
    funktionen.map((f) => [f.name, f.kategorie])
  )

  const stabByKategorie = KATEGORIE_ORDER.map((kat) => ({
    kategorie: kat,
    label: STAB_KATEGORIE_LABELS[kat],
    mitglieder: stab.filter(
      (s) => funktionKategorieMap.get(s.funktion) === kat
    ),
  }))

  // Uncategorized entries (custom function names)
  const categorizedFunktionen = new Set(funktionen.map((f) => f.name))
  const uncategorized = stab.filter(
    (s) => !categorizedFunktionen.has(s.funktion)
  )

  const handleAdd = async () => {
    if (!newEntry.funktion) return
    if (!isExtern && !newEntry.person_id) return
    if (isExtern && !newEntry.externer_name) return

    setIsSubmitting(true)
    setError(null)

    const result = await createStabMitglied({
      produktion_id: produktionId,
      funktion: newEntry.funktion,
      person_id: isExtern ? null : newEntry.person_id,
      externer_name: isExtern ? newEntry.externer_name : null,
      externer_kontakt: isExtern ? newEntry.externer_kontakt || null : null,
      ist_leitung: newEntry.ist_leitung,
      von: null,
      bis: null,
      notizen: newEntry.notizen || null,
    })

    if (!result.success) {
      setError(result.error || 'Fehler beim Hinzufügen')
    } else {
      setShowAddForm(false)
      setNewEntry({
        funktion: '',
        person_id: '',
        externer_name: '',
        externer_kontakt: '',
        ist_leitung: false,
        notizen: '',
      })
      setIsExtern(false)
    }
    setIsSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Teammitglied wirklich entfernen?')) return
    setIsSubmitting(true)
    const result = await deleteStabMitglied(id)
    if (!result.success) {
      setError(result.error || 'Fehler beim Entfernen')
    }
    setIsSubmitting(false)
  }

  const handleToggleLeitung = async (id: string, current: boolean) => {
    setIsSubmitting(true)
    const result = await updateStabMitglied(id, { ist_leitung: !current })
    if (!result.success) {
      setError(result.error || 'Fehler beim Update')
    }
    setIsSubmitting(false)
  }

  const getName = (s: StabMitgliedMitDetails) => {
    if (s.person) {
      return `${s.person.vorname} ${s.person.nachname}`
    }
    if (s.externer_name) {
      return `${s.externer_name} (extern)`
    }
    return 'Unbekannt'
  }

  return (
    <div className="rounded-lg bg-white shadow">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Produktionsteam
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {stab.length} Teammitglied{stab.length !== 1 && 'er'}
          </p>
        </div>
        {canEdit && !showAddForm && (
          <button
            onClick={() => setShowAddForm(true)}
            className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700"
          >
            + Mitglied
          </button>
        )}
      </div>

      {error && (
        <div className="mx-6 mt-4 rounded-lg border border-error-200 bg-error-50 p-3 text-sm text-error-700">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 font-medium underline"
          >
            Schliessen
          </button>
        </div>
      )}

      {/* Add Form */}
      {showAddForm && canEdit && (
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="space-y-3 rounded-lg bg-blue-50 p-4">
            <h3 className="text-sm font-medium text-gray-900">
              Neues Teammitglied
            </h3>

            {/* Funktion */}
            <select
              value={newEntry.funktion}
              onChange={(e) =>
                setNewEntry({ ...newEntry, funktion: e.target.value })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Funktion wählen...</option>
              {funktionenByKategorie.map((group) => (
                <optgroup key={group.kategorie} label={group.label}>
                  {group.funktionen.map((f) => (
                    <option key={f.id} value={f.name}>
                      {f.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>

            {/* Intern/Extern Toggle */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={!isExtern}
                  onChange={() => setIsExtern(false)}
                  className="text-primary-600"
                />
                Mitglied
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  checked={isExtern}
                  onChange={() => setIsExtern(true)}
                  className="text-primary-600"
                />
                Extern
              </label>
            </div>

            {/* Person or External */}
            {isExtern ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Name"
                  value={newEntry.externer_name}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, externer_name: e.target.value })
                  }
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  placeholder="Kontakt (E-Mail/Tel)"
                  value={newEntry.externer_kontakt}
                  onChange={(e) =>
                    setNewEntry({
                      ...newEntry,
                      externer_kontakt: e.target.value,
                    })
                  }
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            ) : (
              <select
                value={newEntry.person_id}
                onChange={(e) =>
                  setNewEntry({ ...newEntry, person_id: e.target.value })
                }
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">Person wählen...</option>
                {personen.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.vorname} {p.nachname}
                  </option>
                ))}
              </select>
            )}

            {/* Leitung checkbox */}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={newEntry.ist_leitung}
                onChange={(e) =>
                  setNewEntry({ ...newEntry, ist_leitung: e.target.checked })
                }
                className="rounded text-primary-600"
              />
              Leitungsfunktion
            </label>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowAddForm(false)
                  setIsExtern(false)
                }}
                className="px-3 py-1.5 text-sm text-gray-600"
              >
                Abbrechen
              </button>
              <button
                onClick={handleAdd}
                disabled={
                  isSubmitting ||
                  !newEntry.funktion ||
                  (!isExtern && !newEntry.person_id) ||
                  (isExtern && !newEntry.externer_name)
                }
                className="rounded-lg bg-primary-600 px-3 py-1.5 text-sm text-white hover:bg-primary-700 disabled:bg-gray-400"
              >
                {isSubmitting ? '...' : 'Hinzufügen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team List */}
      <div className="divide-y divide-gray-200">
        {stabByKategorie.map((group) => {
          if (group.mitglieder.length === 0) return null
          return (
            <div key={group.kategorie}>
              <div className="bg-gray-50 px-6 py-2">
                <h3 className="text-sm font-semibold text-gray-700">
                  {group.label}
                </h3>
              </div>
              {group.mitglieder.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between px-6 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-medium text-primary-700">
                      {s.person
                        ? `${s.person.vorname[0]}${s.person.nachname[0]}`
                        : s.externer_name
                          ? s.externer_name.slice(0, 2).toUpperCase()
                          : '??'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {getName(s)}
                        </span>
                        {s.ist_leitung && (
                          <span className="rounded bg-purple-100 px-1.5 py-0.5 text-xs font-medium text-purple-700">
                            Leitung
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {s.funktion}
                        {s.externer_kontakt && ` | ${s.externer_kontakt}`}
                      </p>
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleLeitung(s.id, s.ist_leitung)}
                        disabled={isSubmitting}
                        className="text-xs text-gray-500 hover:text-gray-700"
                        title={
                          s.ist_leitung
                            ? 'Leitung entfernen'
                            : 'Als Leitung markieren'
                        }
                      >
                        {s.ist_leitung ? 'Leitung -' : 'Leitung +'}
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        disabled={isSubmitting}
                        className="text-xs text-error-600 hover:text-error-800"
                      >
                        Entfernen
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        })}

        {/* Uncategorized */}
        {uncategorized.length > 0 && (
          <div>
            <div className="bg-gray-50 px-6 py-2">
              <h3 className="text-sm font-semibold text-gray-700">Sonstige</h3>
            </div>
            {uncategorized.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between px-6 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                    {s.person
                      ? `${s.person.vorname[0]}${s.person.nachname[0]}`
                      : s.externer_name
                        ? s.externer_name.slice(0, 2).toUpperCase()
                        : '??'}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-900">
                      {getName(s)}
                    </span>
                    <p className="text-xs text-gray-500">{s.funktion}</p>
                  </div>
                </div>
                {canEdit && (
                  <button
                    onClick={() => handleDelete(s.id)}
                    disabled={isSubmitting}
                    className="text-xs text-error-600 hover:text-error-800"
                  >
                    Entfernen
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {stab.length === 0 && !showAddForm && (
          <div className="px-6 py-8 text-center text-gray-500">
            Noch kein Produktionsteam zugewiesen.
          </div>
        )}
      </div>
    </div>
  )
}
