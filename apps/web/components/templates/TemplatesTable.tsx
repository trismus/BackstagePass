'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { AuffuehrungTemplate } from '@/lib/supabase/types'

interface TemplatesTableProps {
  templates: AuffuehrungTemplate[]
}

export function TemplatesTable({ templates }: TemplatesTableProps) {
  const [showArchived, setShowArchived] = useState(false)

  const filtered = templates.filter((t) => showArchived || !t.archiviert)

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  return (
    <div className="rounded-lg bg-white shadow">
      {/* Filter Bar */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            {filtered.length} von {templates.length} Vorlagen
          </p>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">Archivierte anzeigen</span>
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Beschreibung
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Erstellt
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map((t) => (
              <tr
                key={t.id}
                className={`hover:bg-gray-50 ${t.archiviert ? 'opacity-60' : ''}`}
              >
                <td className="whitespace-nowrap px-6 py-4">
                  <Link
                    href={`/templates/${t.id}` as never}
                    className="font-medium text-blue-600 hover:text-blue-800"
                  >
                    {t.name}
                  </Link>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {t.beschreibung || '-'}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      t.archiviert
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {t.archiviert ? 'Archiviert' : 'Aktiv'}
                  </span>
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                  {formatDate(t.created_at)}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right">
                  <Link
                    href={`/templates/${t.id}` as never}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Bearbeiten
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  Keine Vorlagen gefunden
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
