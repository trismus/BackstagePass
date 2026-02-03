'use client'

import { useState } from 'react'
import { downloadStueck } from '@/lib/actions/stuecke'

interface DownloadStueckButtonProps {
  stueckId: string
}

export function DownloadStueckButton({ stueckId }: DownloadStueckButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDownload = async () => {
    setIsDownloading(true)
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
    } catch {
      setError('Download fehlgeschlagen')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-700 disabled:bg-gray-400"
        title="Komplettes Stück herunterladen"
      >
        {isDownloading ? 'Lädt...' : '⬇ Stück herunterladen'}
      </button>
      {error && (
        <p className="mt-1 text-sm text-error-600">{error}</p>
      )}
    </div>
  )
}
