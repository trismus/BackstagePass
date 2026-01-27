'use client'

import { useState } from 'react'
import type { StundenkontoEintrag, StundenTyp } from '@/lib/supabase/types'

interface StundenkontoTableProps {
  entries: StundenkontoEintrag[]
  personId?: string
}

const typLabels: Record<StundenTyp, string> = {
  helfereinsatz: 'Helfereinsatz',
  vereinsevent: 'Vereinsevent',
  sonstiges: 'Sonstiges',
  korrektur: 'Korrektur',
}

const typColors: Record<StundenTyp, string> = {
  helfereinsatz: 'bg-blue-100 text-blue-800',
  vereinsevent: 'bg-purple-100 text-purple-800',
  sonstiges: 'bg-gray-100 text-gray-800',
  korrektur: 'bg-yellow-100 text-yellow-800',
}

export function StundenkontoTable({
  entries,
  personId: _personId,
}: StundenkontoTableProps) {
  const [filterTyp, setFilterTyp] = useState<StundenTyp | 'all'>('all')
  const [filterYear, setFilterYear] = useState<string>('all')

  // Get unique years from entries
  const years = [
    ...new Set(entries.map((e) => new Date(e.created_at).getFullYear())),
  ].sort((a, b) => b - a)

  const filtered = entries.filter((e) => {
    const matchesTyp = filterTyp === 'all' || e.typ === filterTyp
    const matchesYear =
      filterYear === 'all' ||
      new Date(e.created_at).getFullYear().toString() === filterYear
    return matchesTyp && matchesYear
  })

  const totalFiltered = filtered.reduce((sum, e) => sum + e.stunden, 0)

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const handleExportCSV = () => {
    const headers = ['Datum', 'Typ', 'Stunden', 'Beschreibung']
    const rows = filtered.map((e) => [
      formatDate(e.created_at),
      typLabels[e.typ],
      e.stunden.toString().replace('.', ','),
      e.beschreibung || '',
    ])

    const csvContent = [
      headers.join(';'),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(';')),
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], {
      type: 'text/csv;charset=utf-8',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `stundenkonto-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="rounded-lg bg-white shadow">
      {/* Filters */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="mb-1 block text-xs text-gray-500">Typ</label>
            <select
              value={filterTyp}
              onChange={(e) =>
                setFilterTyp(e.target.value as StundenTyp | 'all')
              }
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
            >
              <option value="all">Alle Typen</option>
              {Object.entries(typLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">Jahr</label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
            >
              <option value="all">Alle Jahre</option>
              {years.map((year) => (
                <option key={year} value={year.toString()}>
                  {year}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-4 self-end">
            <span className="text-sm text-gray-600">
              Summe:{' '}
              <strong
                className={
                  totalFiltered >= 0 ? 'text-green-600' : 'text-red-600'
                }
              >
                {totalFiltered >= 0 ? '+' : ''}
                {totalFiltered.toFixed(1)} Stunden
              </strong>
            </span>
            <button
              onClick={handleExportCSV}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 print:hidden"
              title="Als CSV exportieren"
            >
              CSV
            </button>
            <button
              onClick={handlePrint}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 print:hidden"
              title="Drucken"
            >
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Datum
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Typ
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase text-gray-500">
                Beschreibung
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium uppercase text-gray-500">
                Stunden
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map((e) => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600">
                  {formatDate(e.created_at)}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      typColors[e.typ]
                    }`}
                  >
                    {typLabels[e.typ]}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {e.beschreibung || '-'}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <span
                    className={`font-medium ${
                      e.stunden >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {e.stunden >= 0 ? '+' : ''}
                    {e.stunden.toFixed(1)}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                  Keine Einträge gefunden
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
