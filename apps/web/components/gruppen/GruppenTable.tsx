'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { GruppenTypBadge } from './GruppenTypBadge'
import { deleteGruppe } from '@/lib/actions/gruppen'
import type { GruppeMitDetails } from '@/lib/supabase/types'

interface GruppenTableProps {
  gruppen: GruppeMitDetails[]
  canEdit?: boolean
  canDelete?: boolean
}

export function GruppenTable({
  gruppen,
  canEdit = false,
  canDelete = false,
}: GruppenTableProps) {
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Gruppe "${name}" wirklich löschen?`)) return

    setDeletingId(id)
    startTransition(async () => {
      const result = await deleteGruppe(id)
      if (!result.success) {
        alert(result.error || 'Fehler beim Löschen')
      }
      setDeletingId(null)
    })
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-neutral-200">
            <th className="pb-3 text-left text-sm font-medium text-neutral-600">
              Name
            </th>
            <th className="pb-3 text-left text-sm font-medium text-neutral-600">
              Typ
            </th>
            <th className="pb-3 text-left text-sm font-medium text-neutral-600">
              Mitglieder
            </th>
            <th className="pb-3 text-left text-sm font-medium text-neutral-600">
              Stück
            </th>
            <th className="pb-3 text-left text-sm font-medium text-neutral-600">
              Status
            </th>
            {(canEdit || canDelete) && (
              <th className="pb-3 text-left text-sm font-medium text-neutral-600">
                Aktionen
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-100">
          {gruppen.map((gruppe) => (
            <tr
              key={gruppe.id}
              className={!gruppe.aktiv ? 'opacity-50' : ''}
            >
              <td className="py-3">
                <Link
                  href={`/admin/gruppen/${gruppe.id}` as never}
                  className="text-sm font-medium text-neutral-900 hover:text-primary-600"
                >
                  {gruppe.name}
                </Link>
                {gruppe.beschreibung && (
                  <p className="mt-0.5 text-xs text-neutral-500 line-clamp-1">
                    {gruppe.beschreibung}
                  </p>
                )}
              </td>
              <td className="py-3">
                <GruppenTypBadge typ={gruppe.typ} />
              </td>
              <td className="py-3 text-sm text-neutral-600">
                {gruppe.mitglieder_count}
              </td>
              <td className="py-3 text-sm text-neutral-600">
                {gruppe.stueck?.titel || '-'}
              </td>
              <td className="py-3">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    gruppe.aktiv
                      ? 'bg-green-100 text-green-800'
                      : 'bg-neutral-100 text-neutral-600'
                  }`}
                >
                  {gruppe.aktiv ? 'Aktiv' : 'Inaktiv'}
                </span>
              </td>
              {(canEdit || canDelete) && (
                <td className="py-3">
                  <div className="flex gap-2">
                    {canEdit && (
                      <Link
                        href={`/admin/gruppen/${gruppe.id}/bearbeiten` as never}
                        className="text-sm text-primary-600 hover:text-primary-800"
                      >
                        Bearbeiten
                      </Link>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(gruppe.id, gruppe.name)}
                        disabled={isPending && deletingId === gruppe.id}
                        className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                      >
                        {isPending && deletingId === gruppe.id
                          ? 'Löschen...'
                          : 'Löschen'}
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
          {gruppen.length === 0 && (
            <tr>
              <td
                colSpan={canEdit || canDelete ? 6 : 5}
                className="py-8 text-center text-neutral-500"
              >
                Keine Gruppen gefunden
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
