'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteHelferRollenTemplate } from '@/lib/actions/helfer-templates'
import type { HelferRollenTemplate } from '@/lib/supabase/types'

interface TemplatesTableProps {
  templates: HelferRollenTemplate[]
}

export function TemplatesTable({ templates }: TemplatesTableProps) {
  const router = useRouter()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Vorlage "${name}" wirklich löschen?`)) return

    setDeletingId(id)
    const result = await deleteHelferRollenTemplate(id)
    if (!result.success) {
      alert(result.error || 'Fehler beim Löschen')
    }
    router.refresh()
    setDeletingId(null)
  }

  return (
    <div className="rounded-lg bg-white shadow">
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
                Standard-Anzahl
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {templates.map((template) => (
              <tr
                key={template.id}
                className={`hover:bg-gray-50 ${deletingId === template.id ? 'opacity-50' : ''}`}
              >
                <td className="whitespace-nowrap px-6 py-4">
                  <span className="font-medium text-gray-900">
                    {template.name}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {template.beschreibung || '-'}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                  {template.default_anzahl}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right">
                  <button
                    onClick={() => handleDelete(template.id, template.name)}
                    disabled={deletingId === template.id}
                    className="hover:text-error-800 text-sm text-error-600"
                  >
                    Löschen
                  </button>
                </td>
              </tr>
            ))}
            {templates.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  Keine Vorlagen vorhanden
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
