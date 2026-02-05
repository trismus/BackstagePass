'use client'

import { useState } from 'react'
import { addTemplateInfoBlock, removeTemplateInfoBlock } from '@/lib/actions/templates'
import type { TemplateInfoBlock } from '@/lib/supabase/types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, ConfirmDialog } from '@/components/ui'

interface InfoBloeckeEditorProps {
  templateId: string
  infoBloecke: TemplateInfoBlock[]
}

function formatOffset(minutes: number): string {
  const hours = Math.floor(Math.abs(minutes) / 60)
  const mins = Math.abs(minutes) % 60
  const sign = minutes < 0 ? '-' : '+'
  if (hours === 0) return `${sign}${mins}min`
  if (mins === 0) return `${sign}${hours}h`
  return `${sign}${hours}h ${mins}min`
}

export function InfoBloeckeEditor({ templateId, infoBloecke }: InfoBloeckeEditorProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    titel: '',
    beschreibung: '',
    offset_minuten: -60,
    dauer_minuten: 30,
    sortierung: infoBloecke.length,
  })

  const resetForm = () => {
    setFormData({
      titel: '',
      beschreibung: '',
      offset_minuten: -60,
      dauer_minuten: 30,
      sortierung: infoBloecke.length,
    })
    setError(null)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const result = await addTemplateInfoBlock({
        template_id: templateId,
        titel: formData.titel.trim(),
        beschreibung: formData.beschreibung.trim() || null,
        offset_minuten: formData.offset_minuten,
        dauer_minuten: formData.dauer_minuten,
        sortierung: formData.sortierung,
      })

      if (!result.success) {
        setError(result.error ?? 'Fehler beim Hinzufuegen')
        return
      }

      resetForm()
      setIsAdding(false)
    } catch (err) {
      console.error('Error adding info block:', err)
      setError('Ein unerwarteter Fehler ist aufgetreten')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return

    setIsDeleting(true)
    try {
      const result = await removeTemplateInfoBlock(deletingId, templateId)
      if (!result.success) {
        console.error('Failed to delete info block:', result.error)
      }
    } catch (err) {
      console.error('Error deleting info block:', err)
    } finally {
      setIsDeleting(false)
      setDeletingId(null)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Info-Bloecke</CardTitle>
              <CardDescription>
                Helferessen, Briefing, Treffpunkte und andere Informationen
              </CardDescription>
            </div>
            {!isAdding && (
              <Button variant="secondary" size="sm" onClick={() => setIsAdding(true)}>
                Info-Block hinzufuegen
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Add Form */}
          {isAdding && (
            <form onSubmit={handleAdd} className="mb-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
              <h4 className="mb-4 font-medium text-neutral-900">Neuer Info-Block</h4>

              {error && (
                <div className="mb-4 rounded-lg bg-error-50 p-3 text-sm text-error-700">
                  {error}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Titel"
                  name="titel"
                  value={formData.titel}
                  onChange={(e) => setFormData((prev) => ({ ...prev, titel: e.target.value }))}
                  placeholder="z.B. Helferessen, Pflichtbriefing"
                  required
                />

                <div className="w-full">
                  <label
                    htmlFor="beschreibung"
                    className="mb-1 block text-sm font-medium text-neutral-700"
                  >
                    Beschreibung
                  </label>
                  <input
                    id="beschreibung"
                    name="beschreibung"
                    value={formData.beschreibung}
                    onChange={(e) => setFormData((prev) => ({ ...prev, beschreibung: e.target.value }))}
                    className="block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                    placeholder="Optionale Beschreibung..."
                  />
                </div>

                <Input
                  label="Offset (Minuten)"
                  name="offset_minuten"
                  type="number"
                  value={formData.offset_minuten}
                  onChange={(e) => setFormData((prev) => ({ ...prev, offset_minuten: parseInt(e.target.value) || 0 }))}
                  helperText="Negativ = vor Beginn"
                />

                <Input
                  label="Dauer (Minuten)"
                  name="dauer_minuten"
                  type="number"
                  min={1}
                  value={formData.dauer_minuten}
                  onChange={(e) => setFormData((prev) => ({ ...prev, dauer_minuten: parseInt(e.target.value) || 30 }))}
                  required
                />
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    resetForm()
                    setIsAdding(false)
                  }}
                  disabled={isSubmitting}
                >
                  Abbrechen
                </Button>
                <Button type="submit" size="sm" loading={isSubmitting}>
                  Hinzufuegen
                </Button>
              </div>
            </form>
          )}

          {/* List */}
          {infoBloecke.length === 0 ? (
            <div className="py-8 text-center text-neutral-500">
              Noch keine Info-Bloecke definiert.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                      Nr.
                    </th>
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                      Titel
                    </th>
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                      Beschreibung
                    </th>
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                      Offset
                    </th>
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                      Dauer
                    </th>
                    <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {infoBloecke
                    .sort((a, b) => a.sortierung - b.sortierung)
                    .map((ib, index) => (
                      <tr key={ib.id} className="hover:bg-neutral-50">
                        <td className="py-3 text-sm text-neutral-600">
                          {index + 1}
                        </td>
                        <td className="py-3 font-medium text-neutral-900">
                          {ib.titel}
                        </td>
                        <td className="max-w-xs truncate py-3 text-sm text-neutral-600">
                          {ib.beschreibung ?? '-'}
                        </td>
                        <td className="py-3 text-sm text-neutral-600">
                          {formatOffset(ib.offset_minuten)}
                        </td>
                        <td className="py-3 text-sm text-neutral-600">
                          {ib.dauer_minuten} min
                        </td>
                        <td className="py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-error-600 hover:text-error-700"
                            onClick={() => setDeletingId(ib.id)}
                          >
                            Entfernen
                          </Button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deletingId}
        onCancel={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Info-Block entfernen"
        message="Sind Sie sicher, dass Sie diesen Info-Block entfernen moechten?"
        confirmLabel={isDeleting ? 'Entfernen...' : 'Entfernen'}
        variant="danger"
      />
    </>
  )
}
