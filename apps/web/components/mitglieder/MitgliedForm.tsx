'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPerson, updatePerson, deletePerson } from '@/lib/actions/personen'
import type { Person, Rolle } from '@/lib/supabase/types'

interface MitgliedFormProps {
  person?: Person
  mode: 'create' | 'edit'
}

const rollenOptions: { value: Rolle; label: string }[] = [
  { value: 'mitglied', label: 'Mitglied' },
  { value: 'vorstand', label: 'Vorstand' },
  { value: 'regie', label: 'Regie' },
  { value: 'technik', label: 'Technik' },
  { value: 'gast', label: 'Gast' },
]

export function MitgliedForm({ person, mode }: MitgliedFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [vorname, setVorname] = useState(person?.vorname || '')
  const [nachname, setNachname] = useState(person?.nachname || '')
  const [email, setEmail] = useState(person?.email || '')
  const [telefon, setTelefon] = useState(person?.telefon || '')
  const [rolle, setRolle] = useState<Rolle>(person?.rolle || 'mitglied')
  const [aktiv, setAktiv] = useState(person?.aktiv ?? true)
  const [notizen, setNotizen] = useState(person?.notizen || '')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const data = {
      vorname,
      nachname,
      email: email || null,
      telefon: telefon || null,
      rolle,
      aktiv,
      notizen: notizen || null,
    }

    const result =
      mode === 'create'
        ? await createPerson(data)
        : await updatePerson(person!.id, data)

    if (result.success) {
      router.push('/mitglieder')
    } else {
      setError(result.error || 'Ein Fehler ist aufgetreten')
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!person) return
    if (!confirm(`${person.vorname} ${person.nachname} wirklich deaktivieren?`)) return

    setLoading(true)
    const result = await deletePerson(person.id)

    if (result.success) {
      router.push('/mitglieder')
    } else {
      setError(result.error || 'Ein Fehler ist aufgetreten')
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vorname */}
        <div>
          <label htmlFor="vorname" className="block text-sm font-medium text-gray-700 mb-1">
            Vorname *
          </label>
          <input
            id="vorname"
            type="text"
            required
            value={vorname}
            onChange={(e) => setVorname(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Nachname */}
        <div>
          <label htmlFor="nachname" className="block text-sm font-medium text-gray-700 mb-1">
            Nachname *
          </label>
          <input
            id="nachname"
            type="text"
            required
            value={nachname}
            onChange={(e) => setNachname(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            E-Mail
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Telefon */}
        <div>
          <label htmlFor="telefon" className="block text-sm font-medium text-gray-700 mb-1">
            Telefon
          </label>
          <input
            id="telefon"
            type="tel"
            value={telefon}
            onChange={(e) => setTelefon(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Rolle */}
        <div>
          <label htmlFor="rolle" className="block text-sm font-medium text-gray-700 mb-1">
            Rolle
          </label>
          <select
            id="rolle"
            value={rolle}
            onChange={(e) => setRolle(e.target.value as Rolle)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {rollenOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Aktiv */}
        <div className="flex items-center">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={aktiv}
              onChange={(e) => setAktiv(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Aktives Mitglied</span>
          </label>
        </div>
      </div>

      {/* Notizen */}
      <div>
        <label htmlFor="notizen" className="block text-sm font-medium text-gray-700 mb-1">
          Notizen
        </label>
        <textarea
          id="notizen"
          rows={3}
          value={notizen}
          onChange={(e) => setNotizen(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center pt-4 border-t">
        <div>
          {mode === 'edit' && person?.aktiv && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="px-4 py-2 text-red-600 hover:text-red-800 disabled:opacity-50"
            >
              Deaktivieren
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.push('/mitglieder')}
            className="px-4 py-2 text-gray-700 hover:text-gray-900"
          >
            Abbrechen
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
          >
            {loading ? 'Speichern...' : 'Speichern'}
          </button>
        </div>
      </div>
    </form>
  )
}
