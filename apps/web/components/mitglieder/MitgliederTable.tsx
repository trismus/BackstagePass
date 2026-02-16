'use client'

import { useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { RolleBadge } from './RolleBadge'
import { InvitationStatusBadge } from './InvitationStatusBadge'
import { ExportDialog } from './ExportDialog'
import type { Person, Rolle } from '@/lib/supabase/types'
import type {
  MitgliederFilterParams,
  ArchiveFilter,
  SortField,
} from '@/lib/actions/personen'
import { archiveMitglied, reactivateMitglied } from '@/lib/actions/personen'

interface MitgliederTableProps {
  personen: Person[]
  filterParams?: MitgliederFilterParams
  availableSkills?: string[]
  showArchiveActions?: boolean
}

const ROLLEN: Rolle[] = ['mitglied', 'vorstand', 'gast', 'regie', 'technik']
const ROLLEN_LABELS: Record<Rolle, string> = {
  mitglied: 'Mitglied',
  vorstand: 'Vorstand',
  gast: 'Gast',
  regie: 'Regie',
  technik: 'Technik',
}

export function MitgliederTable({
  personen,
  filterParams = {},
  availableSkills = [],
  showArchiveActions = false,
}: MitgliederTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [showExportDialog, setShowExportDialog] = useState(false)

  const {
    search = '',
    status = 'aktiv',
    rolle = [],
    skills = [],
    sortBy = 'name',
    sortOrder = 'asc',
  } = filterParams

  // Build URL with updated params
  const updateParams = (updates: Partial<MitgliederFilterParams>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      params.delete(key)
      if (value !== undefined && value !== '' && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((v) => params.append(key, v))
        } else {
          params.set(key, String(value))
        }
      }
    })

    // Remove default values
    if (params.get('status') === 'aktiv') params.delete('status')
    if (params.get('sortBy') === 'name') params.delete('sortBy')
    if (params.get('sortOrder') === 'asc') params.delete('sortOrder')
    if (params.get('search') === '') params.delete('search')

    const queryString = params.toString()
    router.push(`/mitglieder${queryString ? `?${queryString}` : ''}` as never)
  }

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
      !confirm(`${person.vorname} ${person.nachname} wirklich reaktivieren?`)
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

  const toggleSort = (field: SortField) => {
    if (sortBy === field) {
      updateParams({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' })
    } else {
      updateParams({ sortBy: field, sortOrder: 'asc' })
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) return <span className="ml-1 text-gray-400">↕</span>
    return (
      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
    )
  }

  return (
    <div>
      {/* Filters */}
      <div className="mb-6 space-y-4">
        {/* Row 1: Search and Status */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Suchen nach Name oder E-Mail..."
              defaultValue={search}
              onChange={(e) => {
                const value = e.target.value
                // Debounce search
                const timeout = setTimeout(() => {
                  updateParams({ search: value })
                }, 300)
                return () => clearTimeout(timeout)
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  updateParams({ search: e.currentTarget.value })
                }
              }}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex rounded-lg border border-gray-300 bg-white">
            {(['aktiv', 'archiviert', 'alle'] as ArchiveFilter[]).map(
              (s, idx) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => updateParams({ status: s })}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    status === s
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  } ${idx === 0 ? 'rounded-l-lg' : ''} ${idx === 2 ? 'rounded-r-lg' : 'border-l border-gray-300'}`}
                >
                  {s === 'aktiv' ? 'Aktiv' : s === 'archiviert' ? 'Archiviert' : 'Alle'}
                </button>
              )
            )}
          </div>
        </div>

        {/* Row 2: Role and Skills filters */}
        <div className="flex flex-wrap gap-4">
          {/* Role Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Rolle:</span>
            <div className="flex flex-wrap gap-1">
              {ROLLEN.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    const newRolle = rolle.includes(r)
                      ? rolle.filter((x) => x !== r)
                      : [...rolle, r]
                    updateParams({ rolle: newRolle })
                  }}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    rolle.includes(r)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {ROLLEN_LABELS[r]}
                </button>
              ))}
            </div>
          </div>

          {/* Skills Filter */}
          {availableSkills.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Skills:</span>
              <div className="flex flex-wrap gap-1">
                {availableSkills.slice(0, 8).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      const newSkills = skills.includes(s)
                        ? skills.filter((x) => x !== s)
                        : [...skills, s]
                      updateParams({ skills: newSkills })
                    }}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                      skills.includes(s)
                        ? 'bg-purple-600 text-white'
                        : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
                {availableSkills.length > 8 && (
                  <span className="px-2 py-1 text-xs text-gray-500">
                    +{availableSkills.length - 8} mehr
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Clear Filters */}
          {(rolle.length > 0 || skills.length > 0 || search) && (
            <button
              type="button"
              onClick={() =>
                updateParams({ search: '', rolle: [], skills: [] })
              }
              className="text-sm text-red-600 hover:text-red-800"
            >
              Filter zurücksetzen
            </button>
          )}

          {/* Export Button */}
          <button
            type="button"
            onClick={() => setShowExportDialog(true)}
            className="ml-auto flex items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                onClick={() => toggleSort('name')}
              >
                Name <SortIcon field="name" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Kontakt
              </th>
              <th
                className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                onClick={() => toggleSort('rolle')}
              >
                Rolle <SortIcon field="rolle" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Skills
              </th>
              <th
                className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                onClick={() => toggleSort('mitglied_seit')}
              >
                Mitglied seit <SortIcon field="mitglied_seit" />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {personen.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  {status === 'archiviert'
                    ? 'Keine archivierten Mitglieder'
                    : 'Keine Mitglieder gefunden'}
                </td>
              </tr>
            ) : (
              personen.map((person) => (
                <tr
                  key={person.id}
                  className={`hover:bg-gray-50 ${!person.aktiv ? 'bg-gray-50 opacity-75' : ''}`}
                >
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="font-medium text-gray-900">
                      {person.vorname} {person.nachname}
                    </div>
                    {person.archiviert_am && person.austrittsgrund && (
                      <div className="text-xs text-gray-500">
                        Grund: {person.austrittsgrund}
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
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {person.skills?.slice(0, 3).map((s) => (
                        <span
                          key={s}
                          className="rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700"
                        >
                          {s}
                        </span>
                      ))}
                      {(person.skills?.length || 0) > 3 && (
                        <span className="text-xs text-gray-500">
                          +{person.skills!.length - 3}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {formatDate(person.mitglied_seit)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {!person.aktiv ? (
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          person.archiviert_am
                            ? 'bg-gray-100 text-gray-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {person.archiviert_am ? 'Archiviert' : 'Inaktiv'}
                      </span>
                    ) : (
                      <InvitationStatusBadge
                        profileId={person.profile_id}
                        invitedAt={person.invited_at}
                        invitationAcceptedAt={person.invitation_accepted_at}
                        email={person.email}
                      />
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/mitglieder/${person.id}` as never}
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
        {personen.length} Mitglied{personen.length !== 1 ? 'er' : ''}
        {status === 'archiviert' && ' im Archiv'}
        {status === 'alle' && ' insgesamt'}
      </div>

      {/* Export Dialog */}
      {showExportDialog && (
        <ExportDialog
          filterParams={filterParams}
          onClose={() => setShowExportDialog(false)}
        />
      )}
    </div>
  )
}
