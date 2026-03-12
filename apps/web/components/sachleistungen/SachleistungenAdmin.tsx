'use client'

import { useState, useEffect } from 'react'
import type { SachleistungMitZusagen, ZusageMitName } from '@/lib/supabase/types'
import { SACHLEISTUNG_KATEGORIE_LABELS } from '@/lib/supabase/types'
import { getZusagenMitNamen, addSachleistung, removeSachleistung } from '@/lib/actions/sachleistungen'
import { SachleistungTrackingRow } from './SachleistungTrackingRow'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, ConfirmDialog } from '@/components/ui'

interface SachleistungenAdminProps {
  veranstaltungId: string
  sachleistungen: SachleistungMitZusagen[]
  canEdit: boolean
}

/**
 * Admin section for managing sachleistungen on the Auffuehrung detail page.
 * Shows all sachleistungen with their pledges and delivery tracking.
 */
export function SachleistungenAdmin({
  veranstaltungId,
  sachleistungen,
  canEdit,
}: SachleistungenAdminProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [zusagenMap, setZusagenMap] = useState<Record<string, ZusageMitName[]>>({})
  const [loadingZusagen, setLoadingZusagen] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    anzahl: 1,
    beschreibung: '',
    kategorie: 'sonstiges' as string,
    sichtbarkeit: 'public' as string,
  })

  const loadZusagen = async (sachleistungId: string) => {
    if (zusagenMap[sachleistungId]) return // Already loaded
    setLoadingZusagen(sachleistungId)
    try {
      const data = await getZusagenMitNamen(sachleistungId)
      setZusagenMap((prev) => ({ ...prev, [sachleistungId]: data }))
    } catch (err) {
      console.error('Error loading zusagen:', err)
    } finally {
      setLoadingZusagen(null)
    }
  }

  const handleToggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null)
    } else {
      setExpandedId(id)
      loadZusagen(id)
    }
  }

  // Reload zusagen when sachleistungen data changes (after revalidation)
  useEffect(() => {
    if (expandedId && zusagenMap[expandedId]) {
      // Re-fetch zusagen for currently expanded item
      getZusagenMitNamen(expandedId)
        .then((data) => setZusagenMap((prev) => ({ ...prev, [expandedId]: data })))
        .catch(console.error)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sachleistungen])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const result = await addSachleistung({
        veranstaltung_id: veranstaltungId,
        name: formData.name.trim(),
        anzahl: formData.anzahl,
        beschreibung: formData.beschreibung.trim() || null,
        kategorie: formData.kategorie as 'kuchen' | 'getraenke' | 'salate' | 'material' | 'sonstiges',
        sichtbarkeit: formData.sichtbarkeit as 'intern' | 'public',
      })

      if (!result.success) {
        setError(result.error ?? 'Fehler beim Hinzufügen')
        return
      }

      setFormData({ name: '', anzahl: 1, beschreibung: '', kategorie: 'sonstiges', sichtbarkeit: 'public' })
      setIsAdding(false)
    } catch (err) {
      console.error('Error adding sachleistung:', err)
      setError('Ein unerwarteter Fehler ist aufgetreten')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return
    setIsDeleting(true)
    try {
      await removeSachleistung(deletingId, veranstaltungId)
    } catch (err) {
      console.error('Error deleting sachleistung:', err)
    } finally {
      setIsDeleting(false)
      setDeletingId(null)
    }
  }

  const totalBenötigt = sachleistungen.reduce((sum, s) => sum + s.anzahl, 0)
  const totalZugesagt = sachleistungen.reduce((sum, s) => sum + s.zugesagt_anzahl, 0)
  const totalGeliefert = sachleistungen.reduce((sum, s) => sum + s.geliefert_anzahl, 0)

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Sachleistungen</CardTitle>
              <CardDescription>
                {sachleistungen.length > 0
                  ? `${totalZugesagt}/${totalBenötigt} zugesagt, ${totalGeliefert} geliefert`
                  : 'Kuchen, Salate und andere Spenden'}
              </CardDescription>
            </div>
            {canEdit && !isAdding && (
              <Button variant="secondary" size="sm" onClick={() => setIsAdding(true)}>
                Sachleistung hinzufügen
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Add Form */}
          {isAdding && (
            <form onSubmit={handleAdd} className="mb-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
              <h4 className="mb-4 font-medium text-neutral-900">Neue Sachleistung</h4>

              {error && (
                <div className="mb-4 rounded-lg bg-error-50 p-3 text-sm text-error-700">
                  {error}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Name"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="z.B. Kuchen, Salat"
                  required
                />
                <Input
                  label="Anzahl benötigt"
                  name="anzahl"
                  type="number"
                  min={1}
                  value={formData.anzahl}
                  onChange={(e) => setFormData((prev) => ({ ...prev, anzahl: parseInt(e.target.value) || 1 }))}
                  required
                />
                <div>
                  <label htmlFor="kategorie" className="mb-1 block text-sm font-medium text-neutral-700">
                    Kategorie
                  </label>
                  <select
                    id="kategorie"
                    value={formData.kategorie}
                    onChange={(e) => setFormData((prev) => ({ ...prev, kategorie: e.target.value }))}
                    className="block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    {Object.entries(SACHLEISTUNG_KATEGORIE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="sichtbarkeit" className="mb-1 block text-sm font-medium text-neutral-700">
                    Sichtbarkeit
                  </label>
                  <select
                    id="sichtbarkeit"
                    value={formData.sichtbarkeit}
                    onChange={(e) => setFormData((prev) => ({ ...prev, sichtbarkeit: e.target.value }))}
                    className="block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="public">Öffentlich (Mitmach-Seite)</option>
                    <option value="intern">Nur intern</option>
                  </select>
                </div>
              </div>

              <div className="mt-4">
                <label htmlFor="beschreibung-add" className="mb-1 block text-sm font-medium text-neutral-700">
                  Beschreibung
                </label>
                <input
                  id="beschreibung-add"
                  value={formData.beschreibung}
                  onChange={(e) => setFormData((prev) => ({ ...prev, beschreibung: e.target.value }))}
                  className="block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="Optionale Details..."
                />
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsAdding(false)
                    setError(null)
                  }}
                  disabled={isSubmitting}
                >
                  Abbrechen
                </Button>
                <Button type="submit" size="sm" loading={isSubmitting}>
                  Hinzufügen
                </Button>
              </div>
            </form>
          )}

          {/* Sachleistungen List */}
          {sachleistungen.length === 0 ? (
            <div className="py-8 text-center text-neutral-500">
              Noch keine Sachleistungen definiert.
            </div>
          ) : (
            <div className="space-y-3">
              {sachleistungen.map((sl) => {
                const fillPct = sl.anzahl > 0 ? Math.min(100, Math.round((sl.zugesagt_anzahl / sl.anzahl) * 100)) : 100
                const isFull = sl.offen_anzahl <= 0
                const barColor = isFull ? 'bg-success-500' : fillPct >= 50 ? 'bg-amber-400' : 'bg-red-400'
                const isExpanded = expandedId === sl.id
                const zusagen = zusagenMap[sl.id] || []
                const activeZusagen = zusagen.filter((z) => z.status !== 'storniert')

                return (
                  <div key={sl.id} className="rounded-lg border border-neutral-200">
                    {/* Sachleistung Header */}
                    <button
                      type="button"
                      onClick={() => handleToggleExpand(sl.id)}
                      className="flex w-full items-center justify-between gap-3 p-3 text-left transition-colors hover:bg-neutral-50"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-neutral-900">{sl.name}</span>
                          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500">
                            {SACHLEISTUNG_KATEGORIE_LABELS[sl.kategorie]}
                          </span>
                          {sl.sichtbarkeit === 'intern' && (
                            <span className="rounded-full bg-warning-100 px-2 py-0.5 text-xs text-warning-700">
                              Intern
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-3">
                          <span className="text-xs text-neutral-500">
                            {sl.zugesagt_anzahl}/{sl.anzahl} zugesagt
                            {sl.geliefert_anzahl > 0 && ` · ${sl.geliefert_anzahl} geliefert`}
                          </span>
                          <div className="w-20">
                            <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
                              <div
                                className={`h-full rounded-full ${barColor}`}
                                style={{ width: `${fillPct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {canEdit && (
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeletingId(sl.id)
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.stopPropagation()
                                setDeletingId(sl.id)
                              }
                            }}
                            className="rounded p-1 text-xs text-error-600 hover:bg-error-50"
                          >
                            Entfernen
                          </span>
                        )}
                        <svg
                          className={`h-4 w-4 text-neutral-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>

                    {/* Expanded: Zusagen Details */}
                    {isExpanded && (
                      <div className="border-t border-neutral-100 px-3 pb-3 pt-2">
                        {loadingZusagen === sl.id ? (
                          <p className="py-4 text-center text-sm text-neutral-500">Laden...</p>
                        ) : activeZusagen.length === 0 ? (
                          <p className="py-4 text-center text-sm text-neutral-500">
                            Noch keine Zusagen
                          </p>
                        ) : (
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-neutral-200">
                                <th className="pb-2 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                                  Helfer
                                </th>
                                <th className="pb-2 text-center text-xs font-medium uppercase tracking-wider text-neutral-500">
                                  Anzahl
                                </th>
                                <th className="pb-2 text-center text-xs font-medium uppercase tracking-wider text-neutral-500">
                                  Status
                                </th>
                                <th className="pb-2 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">
                                  Aktion
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {zusagen.map((z) => (
                                <SachleistungTrackingRow key={z.id} zusage={z} />
                              ))}
                            </tbody>
                          </table>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deletingId}
        onCancel={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Sachleistung entfernen"
        message="Sind Sie sicher, dass Sie diese Sachleistung entfernen möchten? Alle zugehörigen Zusagen werden ebenfalls gelöscht."
        confirmLabel={isDeleting ? 'Entfernen...' : 'Entfernen'}
        variant="danger"
      />
    </>
  )
}
