'use client'

import { useState } from 'react'
import type {
  MeetingMitDetails,
  Person,
  AgendaStatus,
  BeschlussStatus,
} from '@/lib/supabase/types'
import {
  MEETING_TYP_LABELS,
  AGENDA_STATUS_LABELS,
  BESCHLUSS_STATUS_LABELS,
  PROTOKOLL_STATUS_MEETING_LABELS,
} from '@/lib/supabase/types'
import {
  createAgendaItem,
  updateAgendaItem,
  deleteAgendaItem,
  createBeschluss,
  updateBeschluss,
  deleteBeschluss,
  updateMeetingProtokoll,
  exportMeetingAsText,
} from '@/lib/actions/meetings'

interface MeetingDetailProps {
  meeting: MeetingMitDetails
  personen: Person[]
  canEdit: boolean
}

export function MeetingDetail({ meeting, personen, canEdit }: MeetingDetailProps) {
  const [activeTab, setActiveTab] = useState<'agenda' | 'beschluesse' | 'protokoll'>('agenda')
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    const result = await exportMeetingAsText(meeting.id)
    if (result.success && result.text) {
      const blob = new Blob([result.text], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `meeting-protokoll-${meeting.veranstaltung.datum}.md`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
    setIsExporting(false)
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-CH', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg bg-white p-6 shadow">
        <div className="flex items-start justify-between">
          <div>
            <span className="inline-block rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-700">
              {MEETING_TYP_LABELS[meeting.meeting_typ]}
            </span>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">
              {meeting.veranstaltung.titel}
            </h1>
            <p className="mt-1 text-gray-600">{formatDate(meeting.veranstaltung.datum)}</p>
          </div>
          {canEdit && (
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {isExporting ? 'Exportieren...' : 'Als Text exportieren'}
            </button>
          )}
        </div>

        {/* Info Grid */}
        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
          {meeting.veranstaltung.startzeit && (
            <div>
              <span className="text-sm text-gray-500">Zeit</span>
              <p className="font-medium text-gray-900">
                {meeting.veranstaltung.startzeit.slice(0, 5)}
                {meeting.veranstaltung.endzeit && ` - ${meeting.veranstaltung.endzeit.slice(0, 5)}`}
              </p>
            </div>
          )}
          {meeting.veranstaltung.ort && (
            <div>
              <span className="text-sm text-gray-500">Ort</span>
              <p className="font-medium text-gray-900">{meeting.veranstaltung.ort}</p>
            </div>
          )}
          {meeting.leiter && (
            <div>
              <span className="text-sm text-gray-500">Leitung</span>
              <p className="font-medium text-gray-900">
                {meeting.leiter.vorname} {meeting.leiter.nachname}
              </p>
            </div>
          )}
          {meeting.protokollant && (
            <div>
              <span className="text-sm text-gray-500">Protokoll</span>
              <p className="font-medium text-gray-900">
                {meeting.protokollant.vorname} {meeting.protokollant.nachname}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex gap-8">
          <button
            onClick={() => setActiveTab('agenda')}
            className={`border-b-2 pb-4 text-sm font-medium ${
              activeTab === 'agenda'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Traktanden ({meeting.agenda.length})
          </button>
          <button
            onClick={() => setActiveTab('beschluesse')}
            className={`border-b-2 pb-4 text-sm font-medium ${
              activeTab === 'beschluesse'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Beschluesse ({meeting.beschluesse.length})
          </button>
          <button
            onClick={() => setActiveTab('protokoll')}
            className={`border-b-2 pb-4 text-sm font-medium ${
              activeTab === 'protokoll'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Protokoll
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'agenda' && (
        <AgendaSection meeting={meeting} personen={personen} canEdit={canEdit} />
      )}
      {activeTab === 'beschluesse' && (
        <BeschluesseSection meeting={meeting} personen={personen} canEdit={canEdit} />
      )}
      {activeTab === 'protokoll' && (
        <ProtokollSection meeting={meeting} canEdit={canEdit} />
      )}
    </div>
  )
}

// =============================================================================
// Agenda Section
// =============================================================================

function AgendaSection({
  meeting,
  personen,
  canEdit,
}: {
  meeting: MeetingMitDetails
  personen: Person[]
  canEdit: boolean
}) {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    titel: '',
    beschreibung: '',
    dauer_minuten: '',
    verantwortlich_id: '',
  })

  const handleCreate = async () => {
    const nextNummer = meeting.agenda.length + 1
    await createAgendaItem({
      meeting_id: meeting.id,
      nummer: nextNummer,
      titel: formData.titel,
      beschreibung: formData.beschreibung || null,
      dauer_minuten: formData.dauer_minuten ? parseInt(formData.dauer_minuten) : null,
      verantwortlich_id: formData.verantwortlich_id || null,
      status: 'offen',
      notizen: null,
    })
    setFormData({ titel: '', beschreibung: '', dauer_minuten: '', verantwortlich_id: '' })
    setShowForm(false)
  }

  const handleUpdateStatus = async (id: string, status: AgendaStatus) => {
    await updateAgendaItem(id, { status })
  }

  const handleDelete = async (id: string) => {
    if (confirm('Traktandum wirklich loeschen?')) {
      await deleteAgendaItem(id)
    }
  }

  return (
    <div className="space-y-4">
      {/* Agenda List */}
      <div className="rounded-lg bg-white shadow">
        {meeting.agenda.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Noch keine Traktanden vorhanden
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {meeting.agenda.map((item) => (
              <li key={item.id} className="p-4">
                <div className="flex items-start gap-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600">
                    {item.nummer}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">{item.titel}</h3>
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          item.status === 'besprochen' || item.status === 'abgeschlossen'
                            ? 'bg-green-100 text-green-700'
                            : item.status === 'vertagt'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {AGENDA_STATUS_LABELS[item.status]}
                      </span>
                    </div>
                    {item.beschreibung && (
                      <p className="mt-1 text-sm text-gray-600">{item.beschreibung}</p>
                    )}
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                      {item.dauer_minuten && <span>{item.dauer_minuten} Min.</span>}
                      {item.verantwortlich_id && (
                        <span>
                          {personen.find((p) => p.id === item.verantwortlich_id)?.vorname}{' '}
                          {personen.find((p) => p.id === item.verantwortlich_id)?.nachname}
                        </span>
                      )}
                    </div>
                    {item.notizen && (
                      <p className="mt-2 rounded bg-yellow-50 p-2 text-sm text-yellow-800">
                        {item.notizen}
                      </p>
                    )}
                  </div>
                  {canEdit && (
                    <div className="flex gap-2">
                      <select
                        value={item.status}
                        onChange={(e) => handleUpdateStatus(item.id, e.target.value as AgendaStatus)}
                        className="rounded border border-gray-300 px-2 py-1 text-sm"
                      >
                        {Object.entries(AGENDA_STATUS_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-error-600 hover:text-error-700"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add Form */}
      {canEdit && (
        <>
          {showForm ? (
            <div className="rounded-lg bg-white p-4 shadow">
              <h3 className="mb-4 font-medium text-gray-900">Neues Traktandum</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input
                  type="text"
                  placeholder="Titel *"
                  value={formData.titel}
                  onChange={(e) => setFormData({ ...formData, titel: e.target.value })}
                  className="rounded-lg border border-gray-300 px-3 py-2"
                />
                <input
                  type="number"
                  placeholder="Dauer (Min.)"
                  value={formData.dauer_minuten}
                  onChange={(e) => setFormData({ ...formData, dauer_minuten: e.target.value })}
                  className="rounded-lg border border-gray-300 px-3 py-2"
                />
                <select
                  value={formData.verantwortlich_id}
                  onChange={(e) => setFormData({ ...formData, verantwortlich_id: e.target.value })}
                  className="rounded-lg border border-gray-300 px-3 py-2"
                >
                  <option value="">Verantwortlich</option>
                  {personen.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.vorname} {p.nachname}
                    </option>
                  ))}
                </select>
                <textarea
                  placeholder="Beschreibung"
                  value={formData.beschreibung}
                  onChange={(e) => setFormData({ ...formData, beschreibung: e.target.value })}
                  className="rounded-lg border border-gray-300 px-3 py-2 md:col-span-2"
                  rows={2}
                />
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!formData.titel}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm text-white disabled:opacity-50"
                >
                  Hinzufuegen
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-4 text-gray-500 hover:border-primary-300 hover:text-primary-600"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Traktandum hinzufuegen
            </button>
          )}
        </>
      )}
    </div>
  )
}

// =============================================================================
// Beschluesse Section
// =============================================================================

function BeschluesseSection({
  meeting,
  personen,
  canEdit,
}: {
  meeting: MeetingMitDetails
  personen: Person[]
  canEdit: boolean
}) {
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    titel: '',
    beschreibung: '',
    agenda_item_id: '',
    abstimmung_ja: '',
    abstimmung_nein: '',
    abstimmung_enthaltung: '',
    zustaendig_id: '',
    faellig_bis: '',
  })

  const handleCreate = async () => {
    const nextNummer = meeting.beschluesse.length + 1
    await createBeschluss({
      meeting_id: meeting.id,
      nummer: nextNummer,
      titel: formData.titel,
      beschreibung: formData.beschreibung || null,
      agenda_item_id: formData.agenda_item_id || null,
      abstimmung_ja: formData.abstimmung_ja ? parseInt(formData.abstimmung_ja) : null,
      abstimmung_nein: formData.abstimmung_nein ? parseInt(formData.abstimmung_nein) : null,
      abstimmung_enthaltung: formData.abstimmung_enthaltung ? parseInt(formData.abstimmung_enthaltung) : null,
      status: 'beschlossen',
      zustaendig_id: formData.zustaendig_id || null,
      faellig_bis: formData.faellig_bis || null,
    })
    setFormData({
      titel: '',
      beschreibung: '',
      agenda_item_id: '',
      abstimmung_ja: '',
      abstimmung_nein: '',
      abstimmung_enthaltung: '',
      zustaendig_id: '',
      faellig_bis: '',
    })
    setShowForm(false)
  }

  const handleUpdateStatus = async (id: string, status: BeschlussStatus) => {
    await updateBeschluss(id, { status })
  }

  const handleDelete = async (id: string) => {
    if (confirm('Beschluss wirklich loeschen?')) {
      await deleteBeschluss(id)
    }
  }

  return (
    <div className="space-y-4">
      {/* Beschluesse List */}
      <div className="rounded-lg bg-white shadow">
        {meeting.beschluesse.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Noch keine Beschluesse vorhanden
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {meeting.beschluesse.map((beschluss) => (
              <li key={beschluss.id} className="p-4">
                <div className="flex items-start gap-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                    B{beschluss.nummer}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">{beschluss.titel}</h3>
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                          beschluss.status === 'beschlossen'
                            ? 'bg-green-100 text-green-700'
                            : beschluss.status === 'umgesetzt'
                            ? 'bg-blue-100 text-blue-700'
                            : beschluss.status === 'abgelehnt'
                            ? 'bg-error-100 text-error-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {BESCHLUSS_STATUS_LABELS[beschluss.status]}
                      </span>
                    </div>
                    {beschluss.beschreibung && (
                      <p className="mt-1 text-sm text-gray-600">{beschluss.beschreibung}</p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      {beschluss.abstimmung_ja !== null && (
                        <span>
                          Abstimmung: {beschluss.abstimmung_ja} Ja / {beschluss.abstimmung_nein || 0} Nein / {beschluss.abstimmung_enthaltung || 0} Enthaltungen
                        </span>
                      )}
                      {beschluss.zustaendig_id && (
                        <span>
                          Zustaendig: {personen.find((p) => p.id === beschluss.zustaendig_id)?.vorname}{' '}
                          {personen.find((p) => p.id === beschluss.zustaendig_id)?.nachname}
                        </span>
                      )}
                      {beschluss.faellig_bis && (
                        <span>
                          Faellig: {new Date(beschluss.faellig_bis).toLocaleDateString('de-CH')}
                        </span>
                      )}
                    </div>
                  </div>
                  {canEdit && (
                    <div className="flex gap-2">
                      <select
                        value={beschluss.status}
                        onChange={(e) => handleUpdateStatus(beschluss.id, e.target.value as BeschlussStatus)}
                        className="rounded border border-gray-300 px-2 py-1 text-sm"
                      >
                        {Object.entries(BESCHLUSS_STATUS_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleDelete(beschluss.id)}
                        className="text-error-600 hover:text-error-700"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add Form */}
      {canEdit && (
        <>
          {showForm ? (
            <div className="rounded-lg bg-white p-4 shadow">
              <h3 className="mb-4 font-medium text-gray-900">Neuer Beschluss</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input
                  type="text"
                  placeholder="Titel *"
                  value={formData.titel}
                  onChange={(e) => setFormData({ ...formData, titel: e.target.value })}
                  className="rounded-lg border border-gray-300 px-3 py-2 md:col-span-2"
                />
                <textarea
                  placeholder="Beschreibung"
                  value={formData.beschreibung}
                  onChange={(e) => setFormData({ ...formData, beschreibung: e.target.value })}
                  className="rounded-lg border border-gray-300 px-3 py-2 md:col-span-2"
                  rows={2}
                />
                <select
                  value={formData.agenda_item_id}
                  onChange={(e) => setFormData({ ...formData, agenda_item_id: e.target.value })}
                  className="rounded-lg border border-gray-300 px-3 py-2"
                >
                  <option value="">Zu Traktandum</option>
                  {meeting.agenda.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nummer}. {item.titel}
                    </option>
                  ))}
                </select>
                <select
                  value={formData.zustaendig_id}
                  onChange={(e) => setFormData({ ...formData, zustaendig_id: e.target.value })}
                  className="rounded-lg border border-gray-300 px-3 py-2"
                >
                  <option value="">Zustaendig</option>
                  {personen.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.vorname} {p.nachname}
                    </option>
                  ))}
                </select>
                <input
                  type="date"
                  placeholder="Faellig bis"
                  value={formData.faellig_bis}
                  onChange={(e) => setFormData({ ...formData, faellig_bis: e.target.value })}
                  className="rounded-lg border border-gray-300 px-3 py-2"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Ja"
                    value={formData.abstimmung_ja}
                    onChange={(e) => setFormData({ ...formData, abstimmung_ja: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    min="0"
                  />
                  <input
                    type="number"
                    placeholder="Nein"
                    value={formData.abstimmung_nein}
                    onChange={(e) => setFormData({ ...formData, abstimmung_nein: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    min="0"
                  />
                  <input
                    type="number"
                    placeholder="Enth."
                    value={formData.abstimmung_enthaltung}
                    onChange={(e) => setFormData({ ...formData, abstimmung_enthaltung: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2"
                    min="0"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!formData.titel}
                  className="rounded-lg bg-primary-600 px-4 py-2 text-sm text-white disabled:opacity-50"
                >
                  Hinzufuegen
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 p-4 text-gray-500 hover:border-primary-300 hover:text-primary-600"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Beschluss hinzufuegen
            </button>
          )}
        </>
      )}
    </div>
  )
}

// =============================================================================
// Protokoll Section
// =============================================================================

function ProtokollSection({
  meeting,
  canEdit,
}: {
  meeting: MeetingMitDetails
  canEdit: boolean
}) {
  const [protokoll, setProtokoll] = useState(meeting.protokoll || '')
  const [status, setStatus] = useState(meeting.protokoll_status)
  const [isSaving, setIsSaving] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    await updateMeetingProtokoll(meeting.id, protokoll, status)
    setIsSaving(false)
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Protokoll</h2>
        {canEdit && (
          <div className="flex items-center gap-4">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as typeof status)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {Object.entries(PROTOKOLL_STATUS_MEETING_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700 disabled:opacity-50"
            >
              {isSaving ? 'Speichern...' : 'Speichern'}
            </button>
          </div>
        )}
      </div>

      {canEdit ? (
        <textarea
          value={protokoll}
          onChange={(e) => setProtokoll(e.target.value)}
          rows={20}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 font-mono text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          placeholder="Protokollinhalt hier eingeben..."
        />
      ) : (
        <div className="whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
          {protokoll || <span className="text-gray-400">Noch kein Protokoll vorhanden</span>}
        </div>
      )}
    </div>
  )
}
