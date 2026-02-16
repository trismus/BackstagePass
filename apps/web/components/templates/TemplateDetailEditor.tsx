'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  addTemplateZeitblock,
  removeTemplateZeitblock,
  updateTemplateZeitblock,
  addTemplateSchicht,
  removeTemplateSchicht,
  updateTemplateSchicht,
  addTemplateRessource,
  removeTemplateRessource,
  addTemplateInfoBlock,
  removeTemplateInfoBlock,
  updateTemplateInfoBlock,
  addTemplateSachleistung,
  removeTemplateSachleistung,
  updateTemplateSachleistung,
} from '@/lib/actions/templates'
import type {
  TemplateMitDetails,
  TemplateZeitblock,
  TemplateSchicht,
  Ressource,
  ZeitblockTyp,
  TemplateInfoBlock,
  TemplateSachleistung,
} from '@/lib/supabase/types'
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

export function TemplateDetailEditor({
  template,
  ressourcen,
}: TemplateDetailEditorProps) {
  const router = useRouter()

  // Zeitblock Form State
  const [showZeitblockForm, setShowZeitblockForm] = useState(false)
  const [zbName, setZbName] = useState('')
  const [zbStartzeit, setZbStartzeit] = useState('19:00')
  const [zbEndzeit, setZbEndzeit] = useState('20:00')
  const [zbTyp, setZbTyp] = useState<ZeitblockTyp>('standard')
  const [zbLoading, setZbLoading] = useState(false)

  // Zeitblock Edit State
  const [editZbId, setEditZbId] = useState<string | null>(null)
  const [editZbName, setEditZbName] = useState('')
  const [editZbStartzeit, setEditZbStartzeit] = useState('')
  const [editZbEndzeit, setEditZbEndzeit] = useState('')
  const [editZbTyp, setEditZbTyp] = useState<ZeitblockTyp>('standard')
  const [editZbLoading, setEditZbLoading] = useState(false)
  const [editZbError, setEditZbError] = useState<string | null>(null)

  // Schicht Form State
  const [showSchichtForm, setShowSchichtForm] = useState(false)
  const [schichtRolle, setSchichtRolle] = useState('')
  const [schichtZeitblock, setSchichtZeitblock] = useState('')
  const [schichtAnzahl, setSchichtAnzahl] = useState('1')
  const [schichtNurMitglieder, setSchichtNurMitglieder] = useState(false)
  const [schichtLoading, setSchichtLoading] = useState(false)

  // Schicht Edit State
  const [editSchichtId, setEditSchichtId] = useState<string | null>(null)
  const [editSchichtRolle, setEditSchichtRolle] = useState('')
  const [editSchichtZeitblock, setEditSchichtZeitblock] = useState('')
  const [editSchichtAnzahl, setEditSchichtAnzahl] = useState('1')
  const [editSchichtNurMitglieder, setEditSchichtNurMitglieder] = useState(false)
  const [editSchichtLoading, setEditSchichtLoading] = useState(false)
  const [editSchichtError, setEditSchichtError] = useState<string | null>(null)

  // Ressource Form State
  const [showRessourceForm, setShowRessourceForm] = useState(false)
  const [ressourceId, setRessourceId] = useState('')
  const [ressourceMenge, setRessourceMenge] = useState('1')
  const [ressourceLoading, setRessourceLoading] = useState(false)

  // Info-Block Form State
  const [showInfoBlockForm, setShowInfoBlockForm] = useState(false)
  const [ibTitel, setIbTitel] = useState('')
  const [ibBeschreibung, setIbBeschreibung] = useState('')
  const [ibStartzeit, setIbStartzeit] = useState('18:00')
  const [ibEndzeit, setIbEndzeit] = useState('18:30')
  const [ibLoading, setIbLoading] = useState(false)

  // Info-Block Edit State
  const [editIbId, setEditIbId] = useState<string | null>(null)
  const [editIbTitel, setEditIbTitel] = useState('')
  const [editIbBeschreibung, setEditIbBeschreibung] = useState('')
  const [editIbStartzeit, setEditIbStartzeit] = useState('')
  const [editIbEndzeit, setEditIbEndzeit] = useState('')
  const [editIbLoading, setEditIbLoading] = useState(false)
  const [editIbError, setEditIbError] = useState<string | null>(null)

  // Sachleistung Form State
  const [showSachleistungForm, setShowSachleistungForm] = useState(false)
  const [slName, setSlName] = useState('')
  const [slAnzahl, setSlAnzahl] = useState('1')
  const [slBeschreibung, setSlBeschreibung] = useState('')
  const [slLoading, setSlLoading] = useState(false)

  // Sachleistung Edit State
  const [editSlId, setEditSlId] = useState<string | null>(null)
  const [editSlName, setEditSlName] = useState('')
  const [editSlAnzahl, setEditSlAnzahl] = useState('1')
  const [editSlBeschreibung, setEditSlBeschreibung] = useState('')
  const [editSlLoading, setEditSlLoading] = useState(false)
  const [editSlError, setEditSlError] = useState<string | null>(null)

  // Filter out already added ressourcen
  const addedRessourceIds = template.ressourcen.map((r) => r.ressource_id)
  const availableRessourcen = ressourcen.filter(
    (r) => !addedRessourceIds.includes(r.id)
  )

  // Zeitblock handlers
  async function handleAddZeitblock(e: React.FormEvent) {
    e.preventDefault()
    setZbLoading(true)
    await addTemplateZeitblock({
      template_id: template.id,
      name: zbName,
      startzeit: zbStartzeit,
      endzeit: zbEndzeit,
      typ: zbTyp,
      sortierung: template.zeitbloecke.length,
    })
    setZbName('')
    setZbStartzeit('19:00')
    setZbEndzeit('20:00')
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

  function startEditZeitblock(zb: TemplateZeitblock) {
    setEditZbId(zb.id)
    setEditZbName(zb.name)
    setEditZbStartzeit(zb.startzeit)
    setEditZbEndzeit(zb.endzeit)
    setEditZbTyp(zb.typ)
    setEditZbError(null)
  }

  async function handleEditZeitblock(e: React.FormEvent) {
    e.preventDefault()
    if (!editZbId) return

    setEditZbLoading(true)
    setEditZbError(null)

    const result = await updateTemplateZeitblock(editZbId, template.id, {
      name: editZbName,
      startzeit: editZbStartzeit,
      endzeit: editZbEndzeit,
      typ: editZbTyp,
    })

    if (result.success) {
      setEditZbId(null)
      router.refresh()
    } else {
      setEditZbError(result.error || 'Ein Fehler ist aufgetreten')
    }
    setEditZbLoading(false)
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
      nur_mitglieder: schichtNurMitglieder,
    })
    setSchichtRolle('')
    setSchichtZeitblock('')
    setSchichtAnzahl('1')
    setSchichtNurMitglieder(false)
    setShowSchichtForm(false)
    setSchichtLoading(false)
    router.refresh()
  }

  async function handleRemoveSchicht(id: string, rolle: string) {
    if (!confirm(`Schicht "${rolle}" entfernen?`)) return
    await removeTemplateSchicht(id, template.id)
    router.refresh()
  }

  function startEditSchicht(s: TemplateSchicht) {
    setEditSchichtId(s.id)
    setEditSchichtRolle(s.rolle)
    setEditSchichtZeitblock(s.zeitblock_name || '')
    setEditSchichtAnzahl(String(s.anzahl_benoetigt))
    setEditSchichtNurMitglieder(s.nur_mitglieder)
    setEditSchichtError(null)
  }

  async function handleEditSchicht(e: React.FormEvent) {
    e.preventDefault()
    if (!editSchichtId) return

    setEditSchichtLoading(true)
    setEditSchichtError(null)

    const result = await updateTemplateSchicht(editSchichtId, template.id, {
      rolle: editSchichtRolle,
      zeitblock_name: editSchichtZeitblock || null,
      anzahl_benoetigt: parseInt(editSchichtAnzahl, 10) || 1,
      nur_mitglieder: editSchichtNurMitglieder,
    })

    if (result.success) {
      setEditSchichtId(null)
      router.refresh()
    } else {
      setEditSchichtError(result.error || 'Ein Fehler ist aufgetreten')
    }
    setEditSchichtLoading(false)
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

  // Info-Block handlers
  async function handleAddInfoBlock(e: React.FormEvent) {
    e.preventDefault()
    setIbLoading(true)
    await addTemplateInfoBlock({
      template_id: template.id,
      titel: ibTitel,
      beschreibung: ibBeschreibung || null,
      startzeit: ibStartzeit,
      endzeit: ibEndzeit,
      sortierung: template.info_bloecke?.length || 0,
    })
    setIbTitel('')
    setIbBeschreibung('')
    setIbStartzeit('18:00')
    setIbEndzeit('18:30')
    setShowInfoBlockForm(false)
    setIbLoading(false)
    router.refresh()
  }

  async function handleRemoveInfoBlock(id: string, titel: string) {
    if (!confirm(`Info-Block "${titel}" entfernen?`)) return
    await removeTemplateInfoBlock(id, template.id)
    router.refresh()
  }

  function startEditInfoBlock(ib: TemplateInfoBlock) {
    setEditIbId(ib.id)
    setEditIbTitel(ib.titel)
    setEditIbBeschreibung(ib.beschreibung || '')
    setEditIbStartzeit(ib.startzeit)
    setEditIbEndzeit(ib.endzeit)
    setEditIbError(null)
  }

  async function handleEditInfoBlock(e: React.FormEvent) {
    e.preventDefault()
    if (!editIbId) return

    setEditIbLoading(true)
    setEditIbError(null)

    const result = await updateTemplateInfoBlock(editIbId, template.id, {
      titel: editIbTitel,
      beschreibung: editIbBeschreibung || null,
      startzeit: editIbStartzeit,
      endzeit: editIbEndzeit,
    })

    if (result.success) {
      setEditIbId(null)
      router.refresh()
    } else {
      setEditIbError(result.error || 'Ein Fehler ist aufgetreten')
    }
    setEditIbLoading(false)
  }

  // Sachleistung handlers
  async function handleAddSachleistung(e: React.FormEvent) {
    e.preventDefault()
    setSlLoading(true)
    await addTemplateSachleistung({
      template_id: template.id,
      name: slName,
      anzahl: parseInt(slAnzahl, 10),
      beschreibung: slBeschreibung || null,
    })
    setSlName('')
    setSlAnzahl('1')
    setSlBeschreibung('')
    setShowSachleistungForm(false)
    setSlLoading(false)
    router.refresh()
  }

  async function handleRemoveSachleistung(id: string, name: string) {
    if (!confirm(`Sachleistung "${name}" entfernen?`)) return
    await removeTemplateSachleistung(id, template.id)
    router.refresh()
  }

  function startEditSachleistung(sl: TemplateSachleistung) {
    setEditSlId(sl.id)
    setEditSlName(sl.name)
    setEditSlAnzahl(String(sl.anzahl))
    setEditSlBeschreibung(sl.beschreibung || '')
    setEditSlError(null)
  }

  async function handleEditSachleistung(e: React.FormEvent) {
    e.preventDefault()
    if (!editSlId) return

    setEditSlLoading(true)
    setEditSlError(null)

    const result = await updateTemplateSachleistung(editSlId, template.id, {
      name: editSlName,
      anzahl: parseInt(editSlAnzahl, 10) || 1,
      beschreibung: editSlBeschreibung || null,
    })

    if (result.success) {
      setEditSlId(null)
      router.refresh()
    } else {
      setEditSlError(result.error || 'Ein Fehler ist aufgetreten')
    }
    setEditSlLoading(false)
  }

  return (
    <div className="space-y-6">
      {/* Zeitblöcke */}
      <div className="rounded-lg bg-white shadow">
        <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-3">
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
          <form
            onSubmit={handleAddZeitblock}
            className="space-y-3 border-b bg-blue-50 p-4"
          >
            <input
              type="text"
              placeholder="Name *"
              required
              value={zbName}
              onChange={(e) => setZbName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-xs text-gray-500">
                  Startzeit
                </label>
                <input
                  type="time"
                  value={zbStartzeit}
                  onChange={(e) => setZbStartzeit(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">
                  Endzeit
                </label>
                <input
                  type="time"
                  value={zbEndzeit}
                  onChange={(e) => setZbEndzeit(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">Typ</label>
                <select
                  value={zbTyp}
                  onChange={(e) => setZbTyp(e.target.value as ZeitblockTyp)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
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
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white"
              >
                Speichern
              </button>
              <button
                type="button"
                onClick={() => setShowZeitblockForm(false)}
                className="px-3 py-1.5 text-sm text-gray-600"
              >
                Abbrechen
              </button>
            </div>
          </form>
        )}

        <div className="divide-y divide-gray-200">
          {template.zeitbloecke.map((zb) =>
            editZbId === zb.id ? (
              <form
                key={zb.id}
                onSubmit={handleEditZeitblock}
                className="space-y-3 bg-blue-50 p-4"
              >
                {editZbError && (
                  <div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
                    {editZbError}
                  </div>
                )}
                <input
                  type="text"
                  placeholder="Name *"
                  required
                  value={editZbName}
                  onChange={(e) => setEditZbName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">
                      Startzeit
                    </label>
                    <input
                      type="time"
                      value={editZbStartzeit}
                      onChange={(e) => setEditZbStartzeit(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">
                      Endzeit
                    </label>
                    <input
                      type="time"
                      value={editZbEndzeit}
                      onChange={(e) => setEditZbEndzeit(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">
                      Typ
                    </label>
                    <select
                      value={editZbTyp}
                      onChange={(e) =>
                        setEditZbTyp(e.target.value as ZeitblockTyp)
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
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
                    disabled={editZbLoading}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white disabled:bg-blue-400"
                  >
                    {editZbLoading ? 'Speichern...' : 'Speichern'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditZbId(null)}
                    className="px-3 py-1.5 text-sm text-gray-600"
                  >
                    Abbrechen
                  </button>
                </div>
              </form>
            ) : (
              <div
                key={zb.id}
                className="flex items-center justify-between p-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{zb.name}</span>
                    <ZeitblockTypBadge typ={zb.typ} />
                  </div>
                  <span className="text-sm text-gray-500">
                    {zb.startzeit} - {zb.endzeit}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => startEditZeitblock(zb)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Bearbeiten
                  </button>
                  <button
                    onClick={() => handleRemoveZeitblock(zb.id, zb.name)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Entfernen
                  </button>
                </div>
              </div>
            )
          )}
          {template.zeitbloecke.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              Keine Zeitblöcke
            </div>
          )}
        </div>
      </div>

      {/* Schichten */}
      <div className="rounded-lg bg-white shadow">
        <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-3">
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
          <form
            onSubmit={handleAddSchicht}
            className="space-y-3 border-b bg-blue-50 p-4"
          >
            <input
              type="text"
              placeholder="Rolle (z.B. Kasse, Einlass) *"
              required
              value={schichtRolle}
              onChange={(e) => setSchichtRolle(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={schichtZeitblock}
                onChange={(e) => setSchichtZeitblock(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
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
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={schichtNurMitglieder}
                onChange={(e) => setSchichtNurMitglieder(e.target.checked)}
                className="rounded border-gray-300"
              />
              Nur Vereinsmitglieder
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={schichtLoading}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white"
              >
                Speichern
              </button>
              <button
                type="button"
                onClick={() => setShowSchichtForm(false)}
                className="px-3 py-1.5 text-sm text-gray-600"
              >
                Abbrechen
              </button>
            </div>
          </form>
        )}

        <div className="divide-y divide-gray-200">
          {template.schichten.map((s) =>
            editSchichtId === s.id ? (
              <form
                key={s.id}
                onSubmit={handleEditSchicht}
                className="space-y-3 bg-blue-50 p-4"
              >
                {editSchichtError && (
                  <div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
                    {editSchichtError}
                  </div>
                )}
                <div>
                  <label className="mb-1 block text-xs text-gray-500">
                    Rolle
                  </label>
                  <input
                    type="text"
                    placeholder="Rolle *"
                    required
                    value={editSchichtRolle}
                    onChange={(e) => setEditSchichtRolle(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">
                      Zeitblock
                    </label>
                    <select
                      value={editSchichtZeitblock}
                      onChange={(e) => setEditSchichtZeitblock(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    >
                      <option value="">Kein Zeitblock</option>
                      {template.zeitbloecke.map((zb) => (
                        <option key={zb.id} value={zb.name}>
                          {zb.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">
                      Anzahl benötigt
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={editSchichtAnzahl}
                      onChange={(e) => setEditSchichtAnzahl(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={editSchichtNurMitglieder}
                    onChange={(e) => setEditSchichtNurMitglieder(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  Nur Vereinsmitglieder
                </label>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={editSchichtLoading}
                    className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white disabled:bg-blue-400"
                  >
                    {editSchichtLoading ? 'Speichern...' : 'Speichern'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditSchichtId(null)}
                    className="px-3 py-1.5 text-sm text-gray-600"
                  >
                    Abbrechen
                  </button>
                </div>
              </form>
            ) : (
              <div
                key={s.id}
                className="flex items-center justify-between p-4"
              >
                <div>
                  <span className="font-medium text-gray-900">{s.rolle}</span>
                  <span className="ml-2 text-sm text-gray-500">
                    ({s.anzahl_benoetigt}x)
                  </span>
                  {s.zeitblock_name && (
                    <span className="ml-2 text-sm text-gray-400">
                      - {s.zeitblock_name}
                    </span>
                  )}
                  {s.nur_mitglieder && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                      nur Mitglieder
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => startEditSchicht(s)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Bearbeiten
                  </button>
                  <button
                    onClick={() => handleRemoveSchicht(s.id, s.rolle)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Entfernen
                  </button>
                </div>
              </div>
            )
          )}
          {template.schichten.length === 0 && (
            <div className="p-8 text-center text-gray-500">Keine Schichten</div>
          )}
        </div>
      </div>

      {/* Ressourcen */}
      <div className="rounded-lg bg-white shadow">
        <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-3">
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
          <form
            onSubmit={handleAddRessource}
            className="space-y-3 border-b bg-blue-50 p-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <select
                value={ressourceId}
                onChange={(e) => setRessourceId(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
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
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={ressourceLoading || !ressourceId}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm text-white"
              >
                Speichern
              </button>
              <button
                type="button"
                onClick={() => setShowRessourceForm(false)}
                className="px-3 py-1.5 text-sm text-gray-600"
              >
                Abbrechen
              </button>
            </div>
          </form>
        )}

        <div className="divide-y divide-gray-200">
          {template.ressourcen.map((r) => (
            <div key={r.id} className="flex items-center justify-between p-4">
              <div>
                <span className="font-medium text-gray-900">
                  {r.ressource?.name || 'Unbekannt'}
                </span>
                <span className="ml-2 text-sm text-gray-500">({r.menge}x)</span>
              </div>
              <button
                onClick={() =>
                  handleRemoveRessource(r.id, r.ressource?.name || 'Ressource')
                }
                className="text-sm text-red-600 hover:text-red-800"
              >
                Entfernen
              </button>
            </div>
          ))}
          {template.ressourcen.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              Keine Ressourcen
            </div>
          )}
        </div>
      </div>

      {/* Info-Blöcke */}
      <div className="rounded-lg bg-white shadow">
        <div className="flex items-center justify-between border-b bg-amber-50 px-4 py-3">
          <h3 className="font-medium text-gray-900">
            Info-Blöcke ({template.info_bloecke?.length || 0})
          </h3>
          {!showInfoBlockForm && (
            <button
              onClick={() => setShowInfoBlockForm(true)}
              className="text-sm text-amber-600 hover:text-amber-800"
            >
              + Hinzufügen
            </button>
          )}
        </div>

        {showInfoBlockForm && (
          <form
            onSubmit={handleAddInfoBlock}
            className="space-y-3 border-b bg-amber-50 p-4"
          >
            <input
              type="text"
              placeholder="Titel (z.B. Helferessen, Briefing) *"
              required
              value={ibTitel}
              onChange={(e) => setIbTitel(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <textarea
              placeholder="Beschreibung (optional)"
              value={ibBeschreibung}
              onChange={(e) => setIbBeschreibung(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-gray-500">
                  Startzeit
                </label>
                <input
                  type="time"
                  value={ibStartzeit}
                  onChange={(e) => setIbStartzeit(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">
                  Endzeit
                </label>
                <input
                  type="time"
                  value={ibEndzeit}
                  onChange={(e) => setIbEndzeit(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  required
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={ibLoading}
                className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm text-white"
              >
                Speichern
              </button>
              <button
                type="button"
                onClick={() => setShowInfoBlockForm(false)}
                className="px-3 py-1.5 text-sm text-gray-600"
              >
                Abbrechen
              </button>
            </div>
          </form>
        )}

        <div className="divide-y divide-gray-200">
          {template.info_bloecke?.map((ib) =>
            editIbId === ib.id ? (
              <form
                key={ib.id}
                onSubmit={handleEditInfoBlock}
                className="space-y-3 bg-amber-50 p-4"
              >
                {editIbError && (
                  <div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
                    {editIbError}
                  </div>
                )}
                <input
                  type="text"
                  placeholder="Titel *"
                  required
                  value={editIbTitel}
                  onChange={(e) => setEditIbTitel(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <textarea
                  placeholder="Beschreibung (optional)"
                  value={editIbBeschreibung}
                  onChange={(e) => setEditIbBeschreibung(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">
                      Startzeit
                    </label>
                    <input
                      type="time"
                      value={editIbStartzeit}
                      onChange={(e) => setEditIbStartzeit(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">
                      Endzeit
                    </label>
                    <input
                      type="time"
                      value={editIbEndzeit}
                      onChange={(e) => setEditIbEndzeit(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={editIbLoading}
                    className="rounded-lg bg-amber-600 px-3 py-1.5 text-sm text-white disabled:bg-amber-400"
                  >
                    {editIbLoading ? 'Speichern...' : 'Speichern'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditIbId(null)}
                    className="px-3 py-1.5 text-sm text-gray-600"
                  >
                    Abbrechen
                  </button>
                </div>
              </form>
            ) : (
              <div key={ib.id} className="flex items-center justify-between p-4">
                <div>
                  <span className="font-medium text-gray-900">{ib.titel}</span>
                  <div className="text-sm text-gray-500">
                    {ib.startzeit} - {ib.endzeit}
                  </div>
                  {ib.beschreibung && (
                    <div className="text-sm text-gray-400">{ib.beschreibung}</div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => startEditInfoBlock(ib)}
                    className="text-sm text-amber-600 hover:text-amber-800"
                  >
                    Bearbeiten
                  </button>
                  <button
                    onClick={() => handleRemoveInfoBlock(ib.id, ib.titel)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Entfernen
                  </button>
                </div>
              </div>
            )
          )}
          {(!template.info_bloecke || template.info_bloecke.length === 0) && (
            <div className="p-8 text-center text-gray-500">
              Keine Info-Blöcke
            </div>
          )}
        </div>
      </div>

      {/* Sachleistungen */}
      <div className="rounded-lg bg-white shadow">
        <div className="flex items-center justify-between border-b bg-green-50 px-4 py-3">
          <h3 className="font-medium text-gray-900">
            Sachleistungen ({template.sachleistungen?.length || 0})
          </h3>
          {!showSachleistungForm && (
            <button
              onClick={() => setShowSachleistungForm(true)}
              className="text-sm text-green-600 hover:text-green-800"
            >
              + Hinzufügen
            </button>
          )}
        </div>

        {showSachleistungForm && (
          <form
            onSubmit={handleAddSachleistung}
            className="space-y-3 border-b bg-green-50 p-4"
          >
            <input
              type="text"
              placeholder="Name (z.B. Kuchen, Salat) *"
              required
              value={slName}
              onChange={(e) => setSlName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs text-gray-500">
                  Anzahl
                </label>
                <input
                  type="number"
                  min="1"
                  value={slAnzahl}
                  onChange={(e) => setSlAnzahl(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-gray-500">
                  Beschreibung
                </label>
                <input
                  type="text"
                  placeholder="Optional"
                  value={slBeschreibung}
                  onChange={(e) => setSlBeschreibung(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={slLoading}
                className="rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white"
              >
                Speichern
              </button>
              <button
                type="button"
                onClick={() => setShowSachleistungForm(false)}
                className="px-3 py-1.5 text-sm text-gray-600"
              >
                Abbrechen
              </button>
            </div>
          </form>
        )}

        <div className="divide-y divide-gray-200">
          {template.sachleistungen?.map((sl) =>
            editSlId === sl.id ? (
              <form
                key={sl.id}
                onSubmit={handleEditSachleistung}
                className="space-y-3 bg-green-50 p-4"
              >
                {editSlError && (
                  <div className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
                    {editSlError}
                  </div>
                )}
                <input
                  type="text"
                  placeholder="Name *"
                  required
                  value={editSlName}
                  onChange={(e) => setEditSlName(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">
                      Anzahl
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={editSlAnzahl}
                      onChange={(e) => setEditSlAnzahl(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-gray-500">
                      Beschreibung
                    </label>
                    <input
                      type="text"
                      placeholder="Optional"
                      value={editSlBeschreibung}
                      onChange={(e) => setEditSlBeschreibung(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={editSlLoading}
                    className="rounded-lg bg-green-600 px-3 py-1.5 text-sm text-white disabled:bg-green-400"
                  >
                    {editSlLoading ? 'Speichern...' : 'Speichern'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditSlId(null)}
                    className="px-3 py-1.5 text-sm text-gray-600"
                  >
                    Abbrechen
                  </button>
                </div>
              </form>
            ) : (
              <div key={sl.id} className="flex items-center justify-between p-4">
                <div>
                  <span className="font-medium text-gray-900">{sl.name}</span>
                  <span className="ml-2 text-sm text-gray-500">
                    ({sl.anzahl}x)
                  </span>
                  {sl.beschreibung && (
                    <span className="ml-2 text-sm text-gray-400">
                      - {sl.beschreibung}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => startEditSachleistung(sl)}
                    className="text-sm text-green-600 hover:text-green-800"
                  >
                    Bearbeiten
                  </button>
                  <button
                    onClick={() => handleRemoveSachleistung(sl.id, sl.name)}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Entfernen
                  </button>
                </div>
              </div>
            )
          )}
          {(!template.sachleistungen ||
            template.sachleistungen.length === 0) && (
            <div className="p-8 text-center text-gray-500">
              Keine Sachleistungen
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
