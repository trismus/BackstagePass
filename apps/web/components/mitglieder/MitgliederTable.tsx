'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { RolleBadge } from './RolleBadge'
import type { Person } from '@/lib/supabase/types'
import type { ArchiveFilter } from '@/lib/actions/personen'
import { archiveMitglied, reactivateMitglied } from '@/lib/actions/personen'

interface MitgliederTableProps {
  personen: Person[]
  filter?: ArchiveFilter
  onFilterChange?: (filter: ArchiveFilter) => void
  showArchiveActions?: boolean
}

export function MitgliederTable({
  personen,
  filter = 'aktiv',
  onFilterChange,
  showArchiveActions = false,
}: MitgliederTableProps) {
  const [search, setSearch] = useState('')
  const [isPending, startTransition] = useTransition()

  const filtered = personen.filter((p) => {
    const matchesSearch =
      search === '' ||
      p.vorname.toLowerCase().includes(search.toLowerCase()) ||
      p.nachname.toLowerCase().includes(search.toLowerCase()) ||
      p.email?.toLowerCase().includes(search.toLowerCase())

    return matchesSearch
  })

  const handleArchive = (person: Person) => {
    if (
      !confirm(
        `${person.vorname} ${person.nachname} wirklich archivieren? Das Mitglied wird als ausgetreten markiert.`
      )
    )
      return

    startTransition(async () => {
      await archiveMitglied(person.id)
    })
  }

  const handleReactivate = (person: Person) => {
    if (
      !confirm(
        `${person.vorname} ${person.nachname} wirklich reaktivieren?`
      )
    )
      return

    startTransition(async () => {
      await reactivateMitglied(person.id)
    })
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  return (
    <div>
      {/* Search and Filter */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Suchen nach Name oder E-Mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {onFilterChange && (
          <div className="flex rounded-lg border border-gray-300 bg-white">
            <button
              type="button"
              onClick={() => onFilterChange('aktiv')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                filter === 'aktiv'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              } rounded-l-lg`}
            >
              Aktiv
            </button>
            <button
              type="button"
              onClick={() => onFilterChange('archiviert')}
              className={`border-l border-gray-300 px-4 py-2 text-sm font-medium transition-colors ${
                filter === 'archiviert'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Archiviert
            </button>
            <button
              type="button"
              onClick={() => onFilterChange('alle')}
              className={`border-l border-gray-300 px-4 py-2 text-sm font-medium transition-colors ${
                filter === 'alle'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              } rounded-r-lg`}
            >
              Alle
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Kontakt
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Rolle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
              {filter === 'archiviert' && (
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Archiviert am
                </th>
              )}
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={filter === 'archiviert' ? 6 : 5}
                  className="px-6 py-8 text-center text-gray-500"
                >
                  {filter === 'archiviert'
                    ? 'Keine archivierten Mitglieder'
                    : 'Keine Mitglieder gefunden'}
                </td>
              </tr>
            ) : (
              filtered.map((person) => (
                <tr
                  key={person.id}
                  className={`hover:bg-gray-50 ${!person.aktiv ? 'bg-gray-50 opacity-75' : ''}`}
                >
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="font-medium text-gray-900">
                      {person.vorname} {person.nachname}
                    </div>
                    {person.archiviert_am && (
                      <div className="text-xs text-gray-500">
                        {person.austrittsgrund && (
                          <span>Grund: {person.austrittsgrund}</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {person.email || '-'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {person.telefon || '-'}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <RolleBadge rolle={person.rolle} />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        person.aktiv
                          ? 'bg-green-100 text-green-800'
                          : person.archiviert_am
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {person.aktiv
                        ? 'Aktiv'
                        : person.archiviert_am
                          ? 'Archiviert'
                          : 'Inaktiv'}
                    </span>
                  </td>
                  {filter === 'archiviert' && (
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {formatDate(person.archiviert_am)}
                    </td>
                  )}
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/mitglieder/${person.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {person.aktiv ? 'Bearbeiten' : 'Anzeigen'}
                      </Link>
                      {showArchiveActions && (
                        <>
                          {person.aktiv ? (
                            <button
                              type="button"
                              onClick={() => handleArchive(person)}
                              disabled={isPending}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            >
                              Archivieren
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleReactivate(person)}
                              disabled={isPending}
                              className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            >
                              Reaktivieren
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Count */}
      <div className="mt-4 text-sm text-gray-500">
        {filtered.length} von {personen.length} Mitglieder
        {personen.length !== 1 ? 'n' : ''}
        {filter === 'archiviert' && ' im Archiv'}
      </div>
    </div>
  )
}
