'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { AnmeldungMitPerson, AnmeldungStatus } from '@/lib/supabase/types'
import { AnmeldungStatusBadge } from './StatusBadge'
import { updateAnmeldungStatus } from '@/lib/actions/anmeldungen'

interface TeilnehmerListeProps {
  anmeldungen: AnmeldungMitPerson[]
  maxTeilnehmer?: number | null
  canEdit?: boolean
}

export function TeilnehmerListe({
  anmeldungen,
  maxTeilnehmer,
  canEdit = false,
}: TeilnehmerListeProps) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const angemeldet = anmeldungen.filter(
    (a) => a.status === 'angemeldet' || a.status === 'teilgenommen'
  )
  const warteliste = anmeldungen.filter((a) => a.status === 'warteliste')

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-CH', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  async function handleStatusChange(id: string, newStatus: AnmeldungStatus) {
    setLoading(id)
    await updateAnmeldungStatus(id, newStatus)
    setLoading(null)
    router.refresh()
  }

  const renderRow = (a: AnmeldungMitPerson) => (
    <tr key={a.id} className="hover:bg-gray-50">
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="font-medium text-gray-900">
          {a.person.vorname} {a.person.nachname}
        </div>
        {a.person.email && (
          <div className="text-sm text-gray-500">{a.person.email}</div>
        )}
      </td>
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
        {formatDate(a.anmeldedatum)}
      </td>
      <td className="px-4 py-3 whitespace-nowrap">
        <AnmeldungStatusBadge status={a.status} />
      </td>
      {canEdit && (
        <td className="px-4 py-3 whitespace-nowrap text-right">
          {loading === a.id ? (
            <span className="text-sm text-gray-400">...</span>
          ) : (
            <select
              value={a.status}
              onChange={(e) =>
                handleStatusChange(a.id, e.target.value as AnmeldungStatus)
              }
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value="angemeldet">Angemeldet</option>
              <option value="warteliste">Warteliste</option>
              <option value="teilgenommen">Teilgenommen</option>
              <option value="abgemeldet">Abgemeldet</option>
            </select>
          )}
        </td>
      )}
    </tr>
  )

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex gap-4 text-sm">
        <span className="text-gray-600">
          <strong>{angemeldet.length}</strong> Angemeldet
          {maxTeilnehmer && ` / ${maxTeilnehmer}`}
        </span>
        {warteliste.length > 0 && (
          <span className="text-yellow-600">
            <strong>{warteliste.length}</strong> auf Warteliste
          </span>
        )}
      </div>

      {/* Angemeldet */}
      {angemeldet.length > 0 && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b">
            <h4 className="font-medium text-gray-900">Angemeldete Teilnehmer</h4>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Angemeldet am
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                {canEdit && (
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Aktion
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {angemeldet.map(renderRow)}
            </tbody>
          </table>
        </div>
      )}

      {/* Warteliste */}
      {warteliste.length > 0 && (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-yellow-50 border-b">
            <h4 className="font-medium text-yellow-800">Warteliste</h4>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Angemeldet am
                </th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                {canEdit && (
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                    Aktion
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {warteliste.map(renderRow)}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {anmeldungen.length === 0 && (
        <div className="bg-white shadow rounded-lg p-8 text-center text-gray-500">
          Noch keine Anmeldungen
        </div>
      )}
    </div>
  )
}
