'use client'

import { useState, useEffect, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { addGruppeMitglied } from '@/lib/actions/gruppen'
import type { Person } from '@/lib/supabase/types'

interface MitgliedHinzufuegenModalProps {
  gruppeId: string
  existingMemberIds: string[]
  onClose: () => void
}

export function MitgliedHinzufuegenModal({
  gruppeId,
  existingMemberIds,
  onClose,
}: MitgliedHinzufuegenModalProps) {
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [personen, setPersonen] = useState<
    Pick<Person, 'id' | 'vorname' | 'nachname' | 'email'>[]
  >([])
  const [loading, setLoading] = useState(true)
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null)
  const [rolleInGruppe, setRolleInGruppe] = useState('')
  const [error, setError] = useState<string | null>(null)

  // Load available persons
  useEffect(() => {
    async function loadPersonen() {
      const supabase = createClient()
      const { data } = await supabase
        .from('personen')
        .select('id, vorname, nachname, email')
        .eq('aktiv', true)
        .order('nachname')

      if (data) {
        // Filter out existing members
        const available = data.filter((p) => !existingMemberIds.includes(p.id))
        setPersonen(available)
      }
      setLoading(false)
    }
    loadPersonen()
  }, [existingMemberIds])

  const filteredPersonen = personen.filter((p) => {
    const fullName = `${p.vorname} ${p.nachname}`.toLowerCase()
    const searchLower = search.toLowerCase()
    return (
      fullName.includes(searchLower) ||
      (p.email?.toLowerCase().includes(searchLower) ?? false)
    )
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedPerson) return

    setError(null)
    startTransition(async () => {
      const result = await addGruppeMitglied({
        gruppe_id: gruppeId,
        person_id: selectedPerson,
        rolle_in_gruppe: rolleInGruppe || null,
        von: null,
        bis: null,
      })

      if (!result.success) {
        setError(result.error || 'Fehler beim Hinzufügen')
        return
      }

      onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-neutral-900">
          Mitglied hinzufügen
        </h2>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Person suchen
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name oder E-Mail..."
              className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Person List */}
          <div className="max-h-48 overflow-y-auto rounded-lg border border-neutral-200">
            {loading ? (
              <p className="p-4 text-center text-sm text-neutral-500">
                Laden...
              </p>
            ) : filteredPersonen.length === 0 ? (
              <p className="p-4 text-center text-sm text-neutral-500">
                Keine verfügbaren Personen gefunden
              </p>
            ) : (
              <div className="divide-y divide-neutral-100">
                {filteredPersonen.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPerson(p.id)}
                    className={`w-full px-4 py-2 text-left transition-colors ${
                      selectedPerson === p.id
                        ? 'bg-primary-50'
                        : 'hover:bg-neutral-50'
                    }`}
                  >
                    <p className="text-sm font-medium text-neutral-900">
                      {p.vorname} {p.nachname}
                    </p>
                    {p.email && (
                      <p className="text-xs text-neutral-500">{p.email}</p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Role in Group */}
          <div>
            <label className="block text-sm font-medium text-neutral-700">
              Rolle in der Gruppe (optional)
            </label>
            <input
              type="text"
              value={rolleInGruppe}
              onChange={(e) => setRolleInGruppe(e.target.value)}
              placeholder="z.B. Teamleiter, Kassier"
              className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-neutral-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={!selectedPerson || isPending}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {isPending ? 'Hinzufügen...' : 'Hinzufügen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
