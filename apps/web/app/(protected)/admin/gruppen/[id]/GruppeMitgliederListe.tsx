'use client'

import { useState, useTransition } from 'react'
import { removeGruppeMitglied } from '@/lib/actions/gruppen'
import type { GruppeMitglied, Person } from '@/lib/supabase/types'
import { MitgliedHinzufuegenModal } from './MitgliedHinzufuegenModal'

type MitgliedMitPerson = GruppeMitglied & {
  person: Pick<Person, 'id' | 'vorname' | 'nachname' | 'email'>
}

interface GruppeMitgliederListeProps {
  gruppeId: string
  mitglieder: MitgliedMitPerson[]
}

export function GruppeMitgliederListe({
  gruppeId,
  mitglieder,
}: GruppeMitgliederListeProps) {
  const [isPending, startTransition] = useTransition()
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)

  async function handleRemove(id: string, name: string) {
    if (!confirm(`${name} wirklich aus der Gruppe entfernen?`)) return

    setRemovingId(id)
    startTransition(async () => {
      const result = await removeGruppeMitglied(id, gruppeId)
      if (!result.success) {
        alert(result.error || 'Fehler beim Entfernen')
      }
      setRemovingId(null)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowModal(true)}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
        >
          Mitglied hinzufügen
        </button>
      </div>

      {mitglieder.length === 0 ? (
        <p className="py-8 text-center text-neutral-500">
          Diese Gruppe hat noch keine Mitglieder
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="pb-3 text-left text-sm font-medium text-neutral-600">
                  Name
                </th>
                <th className="pb-3 text-left text-sm font-medium text-neutral-600">
                  Rolle in Gruppe
                </th>
                <th className="pb-3 text-left text-sm font-medium text-neutral-600">
                  Zeitraum
                </th>
                <th className="pb-3 text-left text-sm font-medium text-neutral-600">
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {mitglieder.map((m) => {
                const name = `${m.person.vorname} ${m.person.nachname}`
                const zeitraum =
                  m.von || m.bis
                    ? `${m.von ? new Date(m.von).toLocaleDateString('de-CH') : '?'} - ${m.bis ? new Date(m.bis).toLocaleDateString('de-CH') : 'heute'}`
                    : '-'

                return (
                  <tr key={m.id}>
                    <td className="py-3">
                      <div>
                        <p className="text-sm font-medium text-neutral-900">
                          {name}
                        </p>
                        {m.person.email && (
                          <p className="text-xs text-neutral-500">
                            {m.person.email}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 text-sm text-neutral-600">
                      {m.rolle_in_gruppe || '-'}
                    </td>
                    <td className="py-3 text-sm text-neutral-600">{zeitraum}</td>
                    <td className="py-3">
                      <button
                        onClick={() => handleRemove(m.id, name)}
                        disabled={isPending && removingId === m.id}
                        className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                      >
                        {isPending && removingId === m.id
                          ? 'Entfernen...'
                          : 'Entfernen'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <MitgliedHinzufuegenModal
          gruppeId={gruppeId}
          existingMemberIds={mitglieder.map((m) => m.person_id)}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
