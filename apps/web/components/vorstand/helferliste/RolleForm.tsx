'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  createHelferRolle,
  updateHelferRolle,
} from '@/lib/actions/helferliste-management'
import type { RollenSichtbarkeit } from '@/lib/supabase/types'

// =============================================================================
// Types
// =============================================================================

interface RolleFormProps {
  eventId: string
  rolle?: {
    id: string
    custom_name: string | null
    anzahl_benoetigt: number
    zeitblock_start: string | null
    zeitblock_end: string | null
    sichtbarkeit: RollenSichtbarkeit
  }
  onClose: () => void
}

// =============================================================================
// Component
// =============================================================================

export function RolleForm({ eventId, rolle, onClose }: RolleFormProps) {
  const router = useRouter()
  const isEdit = !!rolle

  const [customName, setCustomName] = useState(rolle?.custom_name || '')
  const [anzahl, setAnzahl] = useState(rolle?.anzahl_benoetigt || 1)
  const [zeitblockStart, setZeitblockStart] = useState(rolle?.zeitblock_start || '')
  const [zeitblockEnd, setZeitblockEnd] = useState(rolle?.zeitblock_end || '')
  const [sichtbarkeit, setSichtbarkeit] = useState<RollenSichtbarkeit>(
    rolle?.sichtbarkeit || 'intern'
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const data = {
      custom_name: customName,
      anzahl_benoetigt: anzahl,
      zeitblock_start: zeitblockStart || null,
      zeitblock_end: zeitblockEnd || null,
      sichtbarkeit,
    }

    const result = isEdit
      ? await updateHelferRolle(rolle.id, data)
      : await createHelferRolle(eventId, data)

    if (result.success) {
      router.refresh()
      onClose()
    } else {
      setError(result.error || 'Unbekannter Fehler')
    }
    setLoading(false)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-primary-200 bg-primary-50/50 p-4"
    >
      <h4 className="mb-3 text-sm font-semibold text-neutral-900">
        {isEdit ? 'Rolle bearbeiten' : 'Neue Rolle erstellen'}
      </h4>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Name */}
        <div className="sm:col-span-2">
          <label className="mb-1 block text-xs font-medium text-neutral-700">
            Name *
          </label>
          <input
            type="text"
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            placeholder="z.B. Kasse, Garderobe, Bühnenbau..."
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            required
          />
        </div>

        {/* Anzahl */}
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-700">
            Anzahl benötigt *
          </label>
          <input
            type="number"
            value={anzahl}
            onChange={(e) => setAnzahl(parseInt(e.target.value) || 1)}
            min={1}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            required
          />
        </div>

        {/* Sichtbarkeit */}
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-700">
            Sichtbarkeit
          </label>
          <select
            value={sichtbarkeit}
            onChange={(e) => setSichtbarkeit(e.target.value as RollenSichtbarkeit)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="intern">Intern (nur Mitglieder)</option>
            <option value="public">Öffentlich (mit Link)</option>
          </select>
        </div>

        {/* Zeitblock Start */}
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-700">
            Zeitblock Start
          </label>
          <input
            type="datetime-local"
            value={zeitblockStart}
            onChange={(e) => setZeitblockStart(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        {/* Zeitblock End */}
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-700">
            Zeitblock Ende
          </label>
          <input
            type="datetime-local"
            value={zeitblockEnd}
            onChange={(e) => setZeitblockEnd(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-600">{error}</p>
      )}

      <div className="mt-3 flex items-center gap-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:bg-primary-300"
        >
          {loading ? 'Speichern...' : isEdit ? 'Aktualisieren' : 'Erstellen'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100"
        >
          Abbrechen
        </button>
      </div>
    </form>
  )
}
