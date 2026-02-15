'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import type {
  HelferUebersicht,
  AlleHelferFilterParams,
  AlleHelferSortField,
  HelferTyp,
} from '@/lib/actions/alle-helfer'

interface AlleHelferTableProps {
  helfer: HelferUebersicht[]
  filterParams: AlleHelferFilterParams
}

const TYP_OPTIONS: { value: HelferTyp | 'alle'; label: string }[] = [
  { value: 'alle', label: 'Alle' },
  { value: 'intern', label: 'Intern' },
  { value: 'extern', label: 'Extern' },
]

export function AlleHelferTable({
  helfer,
  filterParams = {},
}: AlleHelferTableProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const {
    search = '',
    typ = 'alle',
    sortBy = 'name',
    sortOrder = 'asc',
  } = filterParams

  const updateParams = (updates: Partial<AlleHelferFilterParams>) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      params.delete(key)
      if (value !== undefined && value !== '' && value !== null) {
        params.set(key, String(value))
      }
    })

    // Remove default values
    if (params.get('typ') === 'alle') params.delete('typ')
    if (params.get('sortBy') === 'name') params.delete('sortBy')
    if (params.get('sortOrder') === 'asc') params.delete('sortOrder')
    if (params.get('search') === '') params.delete('search')

    const queryString = params.toString()
    router.push(`/alle-helfer${queryString ? `?${queryString}` : ''}` as never)
  }

  const toggleSort = (field: AlleHelferSortField) => {
    if (sortBy === field) {
      updateParams({ sortOrder: sortOrder === 'asc' ? 'desc' : 'asc' })
    } else {
      updateParams({ sortBy: field, sortOrder: 'asc' })
    }
  }

  const SortIcon = ({ field }: { field: AlleHelferSortField }) => {
    if (sortBy !== field) return <span className="ml-1 text-gray-400">&#8597;</span>
    return (
      <span className="ml-1">{sortOrder === 'asc' ? '\u2191' : '\u2193'}</span>
    )
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
      {/* Filters */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Suchen nach Name oder E-Mail..."
            defaultValue={search}
            onChange={(e) => {
              const value = e.target.value
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
          {TYP_OPTIONS.map((option, idx) => (
            <button
              key={option.value}
              type="button"
              onClick={() => updateParams({ typ: option.value })}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                typ === option.value
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              } ${idx === 0 ? 'rounded-l-lg' : ''} ${idx === TYP_OPTIONS.length - 1 ? 'rounded-r-lg' : 'border-l border-gray-300'}`}
            >
              {option.label}
            </button>
          ))}
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
                Typ
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                E-Mail
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Telefon
              </th>
              <th
                className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                onClick={() => toggleSort('einsaetze')}
              >
                Einsätze <SortIcon field="einsaetze" />
              </th>
              <th
                className="cursor-pointer px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 hover:bg-gray-100"
                onClick={() => toggleSort('letzter_einsatz')}
              >
                Letzter Einsatz <SortIcon field="letzter_einsatz" />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {helfer.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-6 py-8 text-center text-gray-500"
                >
                  Keine Helfer gefunden
                </td>
              </tr>
            ) : (
              helfer.map((h) => (
                <tr key={`${h.typ}-${h.id}`} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    {h.typ === 'intern' ? (
                      <Link
                        href={`/mitglieder/${h.id}` as never}
                        className="font-medium text-blue-600 hover:text-blue-900"
                      >
                        {h.vorname} {h.nachname}
                      </Link>
                    ) : (
                      <span className="font-medium text-gray-900">
                        {h.vorname} {h.nachname}
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        h.typ === 'intern'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {h.typ === 'intern' ? 'Intern' : 'Extern'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {h.email || '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {h.telefon || '-'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                    {h.einsaetze_count}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {formatDate(h.letzter_einsatz)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Count */}
      <div className="mt-4 text-sm text-gray-500">
        {helfer.length} Helfer
        {typ !== 'alle' && ` (${typ === 'intern' ? 'intern' : 'extern'})`}
      </div>
    </div>
  )
}
