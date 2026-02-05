'use client'

import Link from 'next/link'
import { useState } from 'react'
import { archiveTemplate, deleteTemplate } from '@/lib/actions/templates'
import type { AuffuehrungTemplate } from '@/lib/supabase/types'
import { Button, ConfirmDialog } from '@/components/ui'

type TemplateWithCounts = AuffuehrungTemplate & {
  zeitbloeckeCount: number
  schichtenCount: number
  totalSlots: number
}

interface TemplateListProps {
  templates: TemplateWithCounts[]
}

export function TemplateList({ templates }: TemplateListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deletingId) return

    setIsDeleting(true)
    try {
      const result = await deleteTemplate(deletingId)
      if (!result.success) {
        console.error('Failed to delete template:', result.error)
      }
    } catch (error) {
      console.error('Error deleting template:', error)
    } finally {
      setIsDeleting(false)
      setDeletingId(null)
    }
  }

  const handleArchive = async (id: string) => {
    try {
      const result = await archiveTemplate(id)
      if (!result.success) {
        console.error('Failed to archive template:', result.error)
      }
    } catch (error) {
      console.error('Error archiving template:', error)
    }
  }

  if (templates.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <svg
          className="mx-auto h-12 w-12 text-neutral-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z"
          />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-neutral-900">
          Keine Templates vorhanden
        </h3>
        <p className="mt-2 text-neutral-500">
          Erstellen Sie ein neues Template, um Helfer-Schichten fuer Auffuehrungen zu definieren.
        </p>
        <div className="mt-6">
          <Link href={'/admin/schicht-templates/neu' as never}>
            <Button>Erstes Template erstellen</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Zeitbloecke
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Schichten
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Slots
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                Erstellt
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">
                Aktionen
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {templates.map((template) => (
              <tr
                key={template.id}
                className={`hover:bg-neutral-50 ${template.archiviert ? 'bg-neutral-100 opacity-75' : ''}`}
              >
                <td className="whitespace-nowrap px-6 py-4">
                  <Link
                    href={`/admin/schicht-templates/${template.id}` as never}
                    className="font-medium text-neutral-900 hover:text-neutral-700"
                  >
                    {template.name}
                  </Link>
                  {template.beschreibung && (
                    <p className="mt-1 max-w-xs truncate text-sm text-neutral-500">
                      {template.beschreibung}
                    </p>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-600">
                  {template.zeitbloeckeCount}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-600">
                  {template.schichtenCount}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-600">
                  {template.totalSlots}
                </td>
                <td className="whitespace-nowrap px-6 py-4">
                  {template.archiviert ? (
                    <span className="inline-flex rounded-full bg-neutral-200 px-2.5 py-0.5 text-xs font-medium text-neutral-800">
                      Archiviert
                    </span>
                  ) : (
                    <span className="inline-flex rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                      Aktiv
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-sm text-neutral-600">
                  {new Date(template.created_at).toLocaleDateString('de-CH', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </td>
                <td className="whitespace-nowrap px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link href={`/admin/schicht-templates/${template.id}` as never}>
                      <Button variant="ghost" size="sm">
                        Bearbeiten
                      </Button>
                    </Link>
                    {!template.archiviert && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleArchive(template.id)}
                      >
                        Archivieren
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-error-600 hover:text-error-700"
                      onClick={() => setDeletingId(template.id)}
                    >
                      Loeschen
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!deletingId}
        onCancel={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Template loeschen"
        message="Sind Sie sicher, dass Sie dieses Template loeschen moechten? Diese Aktion kann nicht rueckgaengig gemacht werden."
        confirmLabel={isDeleting ? 'Loeschen...' : 'Loeschen'}
        variant="danger"
      />
    </>
  )
}
