'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { Route } from 'next'
import { downloadStueck } from '@/lib/actions/stuecke'
import type { BesetzungMitDetails } from '@/lib/supabase/types'

interface MeineTheaterrollenProps {
  besetzungen: BesetzungMitDetails[]
}

export function MeineTheaterrollen({ besetzungen }: MeineTheaterrollenProps) {
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleDownload = async (stueckId: string) => {
    setDownloadingId(stueckId)
    setError(null)

    try {
      const result = await downloadStueck(stueckId)

      if (result.success && result.content && result.filename) {
        const blob = new Blob([result.content], {
          type: 'text/plain;charset=utf-8',
        })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = result.filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      } else {
        setError(result.error || 'Fehler beim Download')
      }
    } catch (err) {
      setError('Download fehlgeschlagen')
    } finally {
      setDownloadingId(null)
    }
  }

  if (besetzungen.length === 0) {
    return (
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="border-b border-purple-100 bg-purple-50 px-4 py-3">
          <h3 className="font-medium text-purple-900">Meine Rollen</h3>
        </div>
        <div className="p-4 text-center text-sm text-neutral-500">
          Du hast noch keine Theaterrollen
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="border-b border-purple-100 bg-purple-50 px-4 py-3">
        <h3 className="font-medium text-purple-900">Meine Rollen</h3>
      </div>
      <div className="divide-y divide-neutral-100">
        {error && (
          <div className="bg-error-50 border-error-200 border px-4 py-2 text-sm text-error-700">
            {error}
          </div>
        )}
        {besetzungen.map((besetzung) => (
          <div key={besetzung.id} className="px-4 py-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Link
                  href={`/stuecke/${besetzung.rolle.stueck.id}` as Route}
                  className="font-medium text-neutral-900 hover:text-primary-600"
                >
                  {besetzung.rolle.stueck.titel}
                </Link>
                <p className="mt-0.5 text-sm text-neutral-600">
                  als <span className="font-medium">{besetzung.rolle.name}</span>
                  {besetzung.typ !== 'hauptbesetzung' && (
                    <span className="ml-1 text-xs text-neutral-500">
                      ({besetzung.typ === 'zweitbesetzung' ? 'Zweitbesetzung' : 'Ersatz'})
                    </span>
                  )}
                </p>
                {(besetzung.gueltig_von || besetzung.gueltig_bis) && (
                  <p className="mt-1 text-xs text-neutral-500">
                    {besetzung.gueltig_von &&
                      new Date(besetzung.gueltig_von).toLocaleDateString('de-CH')}
                    {besetzung.gueltig_von && besetzung.gueltig_bis && ' - '}
                    {besetzung.gueltig_bis &&
                      new Date(besetzung.gueltig_bis).toLocaleDateString('de-CH')}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDownload(besetzung.rolle.stueck.id)}
                disabled={downloadingId === besetzung.rolle.stueck.id}
                className="ml-4 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-700 disabled:bg-gray-400"
                title="Stück herunterladen"
              >
                {downloadingId === besetzung.rolle.stueck.id ? '...' : '⬇ Script'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
