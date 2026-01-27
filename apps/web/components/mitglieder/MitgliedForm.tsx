'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createPerson, createPersonWithAccount, updatePerson, deletePerson } from '@/lib/actions/personen'
import type { Person, Rolle, UserRole } from '@/lib/supabase/types'

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

const appRollenOptions: { value: UserRole; label: string; description: string }[] = [
  { value: 'VIEWER', label: 'Betrachter', description: 'Kann Daten ansehen' },
  { value: 'EDITOR', label: 'Bearbeiter', description: 'Kann Daten bearbeiten' },
  { value: 'ADMIN', label: 'Administrator', description: 'Vollzugriff' },
]

export function MitgliedForm({ person, mode }: MitgliedFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [vorname, setVorname] = useState(person?.vorname || '')
  const [nachname, setNachname] = useState(person?.nachname || '')
  const [strasse, setStrasse] = useState(person?.strasse || '')
  const [plz, setPlz] = useState(person?.plz || '')
  const [ort, setOrt] = useState(person?.ort || '')
  const [geburtstag, setGeburtstag] = useState(person?.geburtstag || '')
  const [email, setEmail] = useState(person?.email || '')
  const [telefon, setTelefon] = useState(person?.telefon || '')
  const [rolle, setRolle] = useState<Rolle>(person?.rolle || 'mitglied')
  const [aktiv, setAktiv] = useState(person?.aktiv ?? true)
  const [notizen, setNotizen] = useState(person?.notizen || '')

  // App-Zugang
  const [createAppAccount, setCreateAppAccount] = useState(false)
  const [appRole, setAppRole] = useState<UserRole>('VIEWER')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const data = {
      vorname,
      nachname,
      strasse: strasse || null,
      plz: plz || null,
      ort: ort || null,
      geburtstag: geburtstag || null,
      email: email || null,
      telefon: telefon || null,
      rolle,
      aktiv,
      notizen: notizen || null,
    }

    let result
    if (mode === 'create') {
      if (createAppAccount && data.email) {
        result = await createPersonWithAccount(data, appRole)
      } else {
        result = await createPerson(data)
      }
    } else {
      result = await updatePerson(person!.id, data)
    }

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

      {/* Persönliche Daten */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Persönliche Daten</h3>
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

          {/* Geburtstag */}
          <div>
            <label htmlFor="geburtstag" className="block text-sm font-medium text-gray-700 mb-1">
              Geburtstag
            </label>
            <input
              id="geburtstag"
              type="date"
              value={geburtstag}
              onChange={(e) => setGeburtstag(e.target.value)}
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
        </div>
      </div>

      {/* Adresse */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Adresse</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Strasse */}
          <div className="md:col-span-2">
            <label htmlFor="strasse" className="block text-sm font-medium text-gray-700 mb-1">
              Straße
            </label>
            <input
              id="strasse"
              type="text"
              value={strasse}
              onChange={(e) => setStrasse(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Musterstraße 123"
            />
          </div>

          {/* PLZ */}
          <div>
            <label htmlFor="plz" className="block text-sm font-medium text-gray-700 mb-1">
              PLZ
            </label>
            <input
              id="plz"
              type="text"
              value={plz}
              onChange={(e) => setPlz(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="80331"
            />
          </div>

          {/* Ort */}
          <div>
            <label htmlFor="ort" className="block text-sm font-medium text-gray-700 mb-1">
              Ort
            </label>
            <input
              id="ort"
              type="text"
              value={ort}
              onChange={(e) => setOrt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="München"
            />
          </div>
        </div>
      </div>

      {/* Kontakt */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Kontakt</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </div>
      </div>

      {/* App-Zugang - nur bei Erstellung */}
      {mode === 'create' && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">App-Zugang</h3>

          <div className="mb-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={createAppAccount}
                onChange={(e) => setCreateAppAccount(e.target.checked)}
                disabled={!email}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
              />
              <span className="text-sm font-medium text-gray-700">
                App-Zugang erstellen
              </span>
            </label>
            {!email && (
              <p className="text-xs text-gray-500 mt-1 ml-6">
                E-Mail-Adresse erforderlich für App-Zugang
              </p>
            )}
          </div>

          {createAppAccount && email && (
            <div className="ml-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <label htmlFor="appRole" className="block text-sm font-medium text-gray-700 mb-2">
                App-Berechtigung
              </label>
              <select
                id="appRole"
                value={appRole}
                onChange={(e) => setAppRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {appRollenOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} - {opt.description}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-600 mt-2">
                Eine Einladungs-E-Mail wird an {email} gesendet.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Sonstiges */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Sonstiges</h3>

        {/* Aktiv */}
        <div className="mb-4">
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
