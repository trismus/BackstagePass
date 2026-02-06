'use client'

import { useState } from 'react'
import { downloadProbenSzenen } from '@/lib/actions/stuecke'
import { Download } from 'lucide-react'

interface DownloadProbenSzenenButtonProps {
  probeId: string
  hasScenes: boolean
}

export function DownloadProbenSzenenButton({
  probeId,
  hasScenes,
}: DownloadProbenSzenenButtonProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDownload = async () => {
    setIsDownloading(true)
    setError(null)

    try {
      const result = await downloadProbenSzenen(probeId)

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

  if (!hasScenes) {
    return null
  }

  return (
    <div>
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 disabled:bg-gray-100 disabled:text-gray-400"
        title="Szenen dieser Probe herunterladen"
      >
        <Download className="h-4 w-4" />
        {isDownloading ? 'Lädt...' : 'Szenen herunterladen'}
      </button>
      {error && <p className="mt-1 text-sm text-error-600">{error}</p>}
    </div>
  )
}
