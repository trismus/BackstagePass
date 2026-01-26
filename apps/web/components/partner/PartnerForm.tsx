'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPartner, updatePartner, deletePartner } from '@/lib/actions/partner'
import type { Partner } from '@/lib/supabase/types'

interface PartnerFormProps {
  partner?: Partner
  mode: 'create' | 'edit'
  onSuccess?: () => void
}

export function PartnerForm({ partner, mode, onSuccess }: PartnerFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(partner?.name || '')
  const [kontaktName, setKontaktName] = useState(partner?.kontakt_name || '')
  const [kontaktEmail, setKontaktEmail] = useState(partner?.kontakt_email || '')
  const [kontaktTelefon, setKontaktTelefon] = useState(partner?.kontakt_telefon || '')
  const [adresse, setAdresse] = useState(partner?.adresse || '')
  const [notizen, setNotizen] = useState(partner?.notizen || '')
  const [aktiv, setAktiv] = useState(partner?.aktiv ?? true)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const data = {
      name,
      kontakt_name: kontaktName || null,
      kontakt_email: kontaktEmail || null,
      kontakt_telefon: kontaktTelefon || null,
      adresse: adresse || null,
      notizen: notizen || null,
      aktiv,
    }

    const result =
      mode === 'create'
        ? await createPartner(data)
        : await updatePartner(partner!.id, data)

    if (result.success) {
      if (onSuccess) {
        onSuccess()
      } else {
        router.push('/partner')
      }
      router.refresh()
    } else {
      setError(result.error || 'Ein Fehler ist aufgetreten')
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!partner) return
    if (!confirm(`"${partner.name}" wirklich deaktivieren?`)) return

    setLoading(true)
    const result = await deletePartner(partner.id)

    if (result.success) {
      router.push('/partner')
      router.refresh()
    } else {
      setError(result.error || 'Ein Fehler ist aufgetreten')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Name *
        </label>
        <input
          id="name"
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Kontakt Name */}
      <div>
        <label htmlFor="kontaktName" className="block text-sm font-medium text-gray-700 mb-1">
          Ansprechpartner
        </label>
        <input
          id="kontaktName"
          type="text"
          value={kontaktName}
          onChange={(e) => setKontaktName(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Kontakt Email & Telefon */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="kontaktEmail" className="block text-sm font-medium text-gray-700 mb-1">
            E-Mail
          </label>
          <input
            id="kontaktEmail"
            type="email"
            value={kontaktEmail}
            onChange={(e) => setKontaktEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label htmlFor="kontaktTelefon" className="block text-sm font-medium text-gray-700 mb-1">
            Telefon
          </label>
          <input
            id="kontaktTelefon"
            type="tel"
            value={kontaktTelefon}
            onChange={(e) => setKontaktTelefon(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Adresse */}
      <div>
        <label htmlFor="adresse" className="block text-sm font-medium text-gray-700 mb-1">
          Adresse
        </label>
        <input
          id="adresse"
          type="text"
          value={adresse}
          onChange={(e) => setAdresse(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Notizen */}
      <div>
        <label htmlFor="notizen" className="block text-sm font-medium text-gray-700 mb-1">
          Notizen
        </label>
        <textarea
          id="notizen"
          rows={2}
          value={notizen}
          onChange={(e) => setNotizen(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Aktiv */}
      {mode === 'edit' && (
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={aktiv}
              onChange={(e) => setAktiv(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Aktiv</span>
          </label>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center pt-4 border-t">
        <div>
          {mode === 'edit' && partner?.aktiv && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="px-3 py-1.5 text-red-600 hover:text-red-800 text-sm disabled:opacity-50"
            >
              Deaktivieren
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors text-sm"
        >
          {loading ? 'Speichern...' : 'Speichern'}
        </button>
      </div>
    </form>
  )
}
