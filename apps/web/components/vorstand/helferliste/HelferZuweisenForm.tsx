'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  assignProfileToRolle,
  assignExternalHelferToRolle,
} from '@/lib/actions/helferliste-management'

// =============================================================================
// Types
// =============================================================================

interface HelferZuweisenFormProps {
  rolleId: string
  profiles: { id: string; display_name: string | null; email: string }[]
  onClose: () => void
}

type Tab = 'mitglied' | 'extern'

// =============================================================================
// Component
// =============================================================================

export function HelferZuweisenForm({ rolleId, profiles, onClose }: HelferZuweisenFormProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('mitglied')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Mitglied state
  const [selectedProfileId, setSelectedProfileId] = useState('')

  // Extern state
  const [vorname, setVorname] = useState('')
  const [nachname, setNachname] = useState('')
  const [email, setEmail] = useState('')
  const [telefon, setTelefon] = useState('')

  const handleAssignMitglied = async () => {
    if (!selectedProfileId) return
    setLoading(true)
    setError(null)

    const result = await assignProfileToRolle(rolleId, selectedProfileId)
    if (result.success) {
      router.refresh()
      onClose()
    } else {
      setError(result.error || 'Fehler bei der Zuweisung')
    }
    setLoading(false)
  }

  const handleAssignExtern = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await assignExternalHelferToRolle(rolleId, {
      vorname,
      nachname,
      email,
      telefon: telefon || undefined,
    })
    if (result.success) {
      router.refresh()
      onClose()
    } else {
      setError(result.error || 'Fehler bei der Zuweisung')
    }
    setLoading(false)
  }

  return (
    <div className="rounded-lg border border-primary-200 bg-primary-50/50 p-4">
      <h4 className="mb-3 text-sm font-semibold text-neutral-900">
        Helfer zuweisen
      </h4>

      {/* Tabs */}
      <div className="mb-3 flex gap-1 rounded-lg bg-neutral-100 p-1">
        <button
          onClick={() => { setActiveTab('mitglied'); setError(null) }}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            activeTab === 'mitglied'
              ? 'bg-white text-neutral-900 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          Mitglied
        </button>
        <button
          onClick={() => { setActiveTab('extern'); setError(null) }}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            activeTab === 'extern'
              ? 'bg-white text-neutral-900 shadow-sm'
              : 'text-neutral-500 hover:text-neutral-700'
          }`}
        >
          Extern
        </button>
      </div>

      {/* Mitglied Tab */}
      {activeTab === 'mitglied' && (
        <div className="space-y-3">
          <select
            value={selectedProfileId}
            onChange={(e) => { setSelectedProfileId(e.target.value); setError(null) }}
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">Mitglied auswählen...</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.display_name || p.email}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <button
              onClick={handleAssignMitglied}
              disabled={loading || !selectedProfileId}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:bg-primary-300"
            >
              {loading ? '...' : 'Zuweisen'}
            </button>
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Extern Tab */}
      {activeTab === 'extern' && (
        <form onSubmit={handleAssignExtern} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-700">
                Vorname *
              </label>
              <input
                type="text"
                value={vorname}
                onChange={(e) => setVorname(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-700">
                Nachname *
              </label>
              <input
                type="text"
                value={nachname}
                onChange={(e) => setNachname(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-700">
                E-Mail *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-700">
                Telefon
              </label>
              <input
                type="text"
                value={telefon}
                onChange={(e) => setTelefon(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:bg-primary-300"
            >
              {loading ? '...' : 'Zuweisen'}
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
      )}

      {error && (
        <p className="mt-2 text-xs text-red-600">{error}</p>
      )}
    </div>
  )
}
