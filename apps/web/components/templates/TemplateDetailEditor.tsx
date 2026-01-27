'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  addTemplateZeitblock,
  removeTemplateZeitblock,
  addTemplateSchicht,
  removeTemplateSchicht,
  addTemplateRessource,
  removeTemplateRessource,
} from '@/lib/actions/templates'
import type { TemplateMitDetails, Ressource, ZeitblockTyp } from '@/lib/supabase/types'
import { ZeitblockTypBadge } from '@/components/auffuehrungen/ZeitblockTypBadge'

interface TemplateDetailEditorProps {
  template: TemplateMitDetails
  ressourcen: Ressource[]
}

const zeitblockTypen: { value: ZeitblockTyp; label: string }[] = [
  { value: 'aufbau', label: 'Aufbau' },
  { value: 'einlass', label: 'Einlass' },
  { value: 'vorfuehrung', label: 'Vorführung' },
  { value: 'pause', label: 'Pause' },
  { value: 'abbau', label: 'Abbau' },
  { value: 'standard', label: 'Standard' },
]

export function TemplateDetailEditor({ template, ressourcen }: TemplateDetailEditorProps) {
  const router = useRouter()

  // Zeitblock Form State
  const [showZeitblockForm, setShowZeitblockForm] = useState(false)
  const [zbName, setZbName] = useState('')
  const [zbOffset, setZbOffset] = useState('0')
  const [zbDauer, setZbDauer] = useState('30')
  const [zbTyp, setZbTyp] = useState<ZeitblockTyp>('standard')
  const [zbLoading, setZbLoading] = useState(false)

  // Schicht Form State
  const [showSchichtForm, setShowSchichtForm] = useState(false)
  const [schichtRolle, setSchichtRolle] = useState('')
  const [schichtZeitblock, setSchichtZeitblock] = useState('')
  const [schichtAnzahl, setSchichtAnzahl] = useState('1')
  const [schichtLoading, setSchichtLoading] = useState(false)

  // Ressource Form State
  const [showRessourceForm, setShowRessourceForm] = useState(false)
  const [ressourceId, setRessourceId] = useState('')
  const [ressourceMenge, setRessourceMenge] = useState('1')
  const [ressourceLoading, setRessourceLoading] = useState(false)

  // Filter out already added ressourcen
  const addedRessourceIds = template.ressourcen.map((r) => r.ressource_id)
  const availableRessourcen = ressourcen.filter((r) => !addedRessourceIds.includes(r.id))

  // Zeitblock handlers
  async function handleAddZeitblock(e: React.FormEvent) {
    e.preventDefault()
    setZbLoading(true)
    await addTemplateZeitblock({
      template_id: template.id,
      name: zbName,
      offset_minuten: parseInt(zbOffset, 10),
      dauer_minuten: parseInt(zbDauer, 10),
      typ: zbTyp,
      sortierung: template.zeitbloecke.length,
    })
    setZbName('')
    setZbOffset('0')
    setZbDauer('30')
    setZbTyp('standard')
    setShowZeitblockForm(false)
    setZbLoading(false)
    router.refresh()
  }

  async function handleRemoveZeitblock(id: string, name: string) {
    if (!confirm(`Zeitblock "${name}" entfernen?`)) return
    await removeTemplateZeitblock(id, template.id)
    router.refresh()
  }

  // Schicht handlers
  async function handleAddSchicht(e: React.FormEvent) {
    e.preventDefault()
    setSchichtLoading(true)
    await addTemplateSchicht({
      template_id: template.id,
      zeitblock_name: schichtZeitblock || null,
      rolle: schichtRolle,
      anzahl_benoetigt: parseInt(schichtAnzahl, 10),
    })
    setSchichtRolle('')
    setSchichtZeitblock('')
    setSchichtAnzahl('1')
    setShowSchichtForm(false)
    setSchichtLoading(false)
    router.refresh()
  }

  async function handleRemoveSchicht(id: string, rolle: string) {
    if (!confirm(`Schicht "${rolle}" entfernen?`)) return
    await removeTemplateSchicht(id, template.id)
    router.refresh()
  }

  // Ressource handlers
  async function handleAddRessource(e: React.FormEvent) {
    e.preventDefault()
    if (!ressourceId) return
    setRessourceLoading(true)
    await addTemplateRessource({
      template_id: template.id,
      ressource_id: ressourceId,
      menge: parseInt(ressourceMenge, 10),
    })
    setRessourceId('')
    setRessourceMenge('1')
    setShowRessourceForm(false)
    setRessourceLoading(false)
    router.refresh()
  }

  async function handleRemoveRessource(id: string, name: string) {
    if (!confirm(`Ressource "${name}" entfernen?`)) return
    await removeTemplateRessource(id, template.id)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      {/* Zeitblöcke */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-3 bg-gray-50 border-b flex justify-between items-center">
          <h3 className="font-medium text-gray-900">
            Zeitblöcke ({template.zeitbloecke.length})
          </h3>
          {!showZeitblockForm && (
            <button
              onClick={() => setShowZeitblockForm(true)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              + Hinzufügen
            </button>
          )}
        </div>

        {showZeitblockForm && (
          <form onSubmit={handleAddZeitblock} className="p-4 border-b bg-blue-50 space-y-3">
            <input
              type="text"
              placeholder="Name *"
              required
              value={zbName}
              onChange={(e) => setZbName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Offset (Min)</label>
                <input
                  type="number"
                  value={zbOffset}
                  onChange={(e) => setZbOffset(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Dauer (Min)</label>
                <input
                  type="number"
                  min="1"
                  value={zbDauer}
                  onChange={(e) => setZbDauer(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Typ</label>
                <select
                  value={zbTyp}
                  onChange={(e) => setZbTyp(e.target.value as ZeitblockTyp)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                >
                  {zeitblockTypen.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={zbLoading}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm"
              >
                Speichern
              </button>
              <button
                type="button"
                onClick={() => setShowZeitblockForm(false)}
                className="px-3 py-1.5 text-gray-600 text-sm"
              >
                Abbrechen
              </button>
            </div>
          </form>
        )}

        <div className="divide-y divide-gray-200">
          {template.zeitbloecke.map((zb) => (
            <div key={zb.id} className="p-4 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{zb.name}</span>
                  <ZeitblockTypBadge typ={zb.typ} />
                </div>
                <span className="text-sm text-gray-500">
                  Offset: {zb.offset_minuten} Min, Dauer: {zb.dauer_minuten} Min
                </span>
              </div>
              <button
                onClick={() => handleRemoveZeitblock(zb.id, zb.name)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Entfernen
              </button>
            </div>
          ))}
          {template.zeitbloecke.length === 0 && (
            <div className="p-8 text-center text-gray-500">Keine Zeitblöcke</div>
          )}
        </div>
      </div>

      {/* Schichten */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-3 bg-gray-50 border-b flex justify-between items-center">
          <h3 className="font-medium text-gray-900">
            Schichten ({template.schichten.length})
          </h3>
          {!showSchichtForm && (
            <button
              onClick={() => setShowSchichtForm(true)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              + Hinzufügen
            </button>
          )}
        </div>

        {showSchichtForm && (
          <form onSubmit={handleAddSchicht} className="p-4 border-b bg-blue-50 space-y-3">
            <input
              type="text"
              placeholder="Rolle (z.B. Kasse, Einlass) *"
              required
              value={schichtRolle}
              onChange={(e) => setSchichtRolle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={schichtZeitblock}
                onChange={(e) => setSchichtZeitblock(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Kein Zeitblock</option>
                {template.zeitbloecke.map((zb) => (
                  <option key={zb.id} value={zb.name}>
                    {zb.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                placeholder="Anzahl"
                value={schichtAnzahl}
                onChange={(e) => setSchichtAnzahl(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={schichtLoading}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm"
              >
                Speichern
              </button>
              <button
                type="button"
                onClick={() => setShowSchichtForm(false)}
                className="px-3 py-1.5 text-gray-600 text-sm"
              >
                Abbrechen
              </button>
            </div>
          </form>
        )}

        <div className="divide-y divide-gray-200">
          {template.schichten.map((s) => (
            <div key={s.id} className="p-4 flex justify-between items-center">
              <div>
                <span className="font-medium text-gray-900">{s.rolle}</span>
                <span className="text-sm text-gray-500 ml-2">({s.anzahl_benoetigt}x)</span>
                {s.zeitblock_name && (
                  <span className="text-sm text-gray-400 ml-2">- {s.zeitblock_name}</span>
                )}
              </div>
              <button
                onClick={() => handleRemoveSchicht(s.id, s.rolle)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Entfernen
              </button>
            </div>
          ))}
          {template.schichten.length === 0 && (
            <div className="p-8 text-center text-gray-500">Keine Schichten</div>
          )}
        </div>
      </div>

      {/* Ressourcen */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-3 bg-gray-50 border-b flex justify-between items-center">
          <h3 className="font-medium text-gray-900">
            Ressourcen ({template.ressourcen.length})
          </h3>
          {!showRessourceForm && availableRessourcen.length > 0 && (
            <button
              onClick={() => setShowRessourceForm(true)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              + Hinzufügen
            </button>
          )}
        </div>

        {showRessourceForm && (
          <form onSubmit={handleAddRessource} className="p-4 border-b bg-blue-50 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <select
                value={ressourceId}
                onChange={(e) => setRessourceId(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Ressource wählen...</option>
                {availableRessourcen.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                placeholder="Menge"
                value={ressourceMenge}
                onChange={(e) => setRessourceMenge(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={ressourceLoading || !ressourceId}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm"
              >
                Speichern
              </button>
              <button
                type="button"
                onClick={() => setShowRessourceForm(false)}
                className="px-3 py-1.5 text-gray-600 text-sm"
              >
                Abbrechen
              </button>
            </div>
          </form>
        )}

        <div className="divide-y divide-gray-200">
          {template.ressourcen.map((r) => (
            <div key={r.id} className="p-4 flex justify-between items-center">
              <div>
                <span className="font-medium text-gray-900">
                  {r.ressource?.name || 'Unbekannt'}
                </span>
                <span className="text-sm text-gray-500 ml-2">({r.menge}x)</span>
              </div>
              <button
                onClick={() => handleRemoveRessource(r.id, r.ressource?.name || 'Ressource')}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Entfernen
              </button>
            </div>
          ))}
          {template.ressourcen.length === 0 && (
            <div className="p-8 text-center text-gray-500">Keine Ressourcen</div>
          )}
        </div>
      </div>
    </div>
  )
}
