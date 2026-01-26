'use client'

import { useState } from 'react'
import type { StundenkontoEintrag, StundenTyp } from '@/lib/supabase/types'

interface StundenkontoTableProps {
  entries: StundenkontoEintrag[]
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

export function StundenkontoTable({ entries }: StundenkontoTableProps) {
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

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Filters */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Typ</label>
            <select
              value={filterTyp}
              onChange={(e) => setFilterTyp(e.target.value as StundenTyp | 'all')}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
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
            <label className="block text-xs text-gray-500 mb-1">Jahr</label>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
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
          <div className="self-end">
            <span className="text-sm text-gray-600">
              Summe:{' '}
              <strong
                className={totalFiltered >= 0 ? 'text-green-600' : 'text-red-600'}
              >
                {totalFiltered >= 0 ? '+' : ''}
                {totalFiltered.toFixed(1)} Stunden
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Datum
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Typ
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Beschreibung
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Stunden
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map((e) => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  {formatDate(e.created_at)}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      typColors[e.typ]
                    }`}
                  >
                    {typLabels[e.typ]}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {e.beschreibung || '-'}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-right">
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
