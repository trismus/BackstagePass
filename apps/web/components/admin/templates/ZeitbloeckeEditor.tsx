'use client'

import { useState } from 'react'
import { addTemplateZeitblock, removeTemplateZeitblock } from '@/lib/actions/templates'
import type { TemplateZeitblock, ZeitblockTyp } from '@/lib/supabase/types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, ConfirmDialog } from '@/components/ui'

const ZEITBLOCK_TYPEN: { value: ZeitblockTyp; label: string }[] = [
  { value: 'aufbau', label: 'Aufbau' },
  { value: 'einlass', label: 'Einlass' },
  { value: 'vorfuehrung', label: 'Vorfuehrung' },
  { value: 'pause', label: 'Pause' },
  { value: 'abbau', label: 'Abbau' },
  { value: 'standard', label: 'Standard' },
]

interface ZeitbloeckeEditorProps {
  templateId: string
  zeitbloecke: TemplateZeitblock[]
}

function formatOffset(minutes: number): string {
  const hours = Math.floor(Math.abs(minutes) / 60)
  const mins = Math.abs(minutes) % 60
  const sign = minutes < 0 ? '-' : '+'
  if (hours === 0) return `${sign}${mins}min`
  if (mins === 0) return `${sign}${hours}h`
  return `${sign}${hours}h ${mins}min`
}

export function ZeitbloeckeEditor({ templateId, zeitbloecke }: ZeitbloeckeEditorProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    offset_minuten: 0,
    dauer_minuten: 60,
    typ: 'standard' as ZeitblockTyp,
    sortierung: zeitbloecke.length,
  })

  const resetForm = () => {
    setFormData({
      name: '',
      offset_minuten: 0,
      dauer_minuten: 60,
      typ: 'standard',
      sortierung: zeitbloecke.length,
    })
    setError(null)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const result = await addTemplateZeitblock({
        template_id: templateId,
        name: formData.name.trim(),
        offset_minuten: formData.offset_minuten,
        dauer_minuten: formData.dauer_minuten,
        typ: formData.typ,
        sortierung: formData.sortierung,
      })

      if (!result.success) {
        setError(result.error ?? 'Fehler beim Hinzufuegen')
        return
      }

      resetForm()
      setIsAdding(false)
    } catch (err) {
      console.error('Error adding zeitblock:', err)
      setError('Ein unerwarteter Fehler ist aufgetreten')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return

    setIsDeleting(true)
    try {
      const result = await removeTemplateZeitblock(deletingId, templateId)
      if (!result.success) {
        console.error('Failed to delete zeitblock:', result.error)
      }
    } catch (err) {
      console.error('Error deleting zeitblock:', err)
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
              <CardTitle>Zeitbloecke</CardTitle>
              <CardDescription>
                Zeitraeume relativ zum Vorstellungsbeginn (Offset 0 = Beginn)
              </CardDescription>
            </div>
            {!isAdding && (
              <Button variant="secondary" size="sm" onClick={() => setIsAdding(true)}>
                Zeitblock hinzufuegen
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Add Form */}
          {isAdding && (
            <form onSubmit={handleAdd} className="mb-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
              <h4 className="mb-4 font-medium text-neutral-900">Neuer Zeitblock</h4>

              {error && (
                <div className="mb-4 rounded-lg bg-error-50 p-3 text-sm text-error-700">
                  {error}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Input
                  label="Name"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="z.B. Aufbau Saal"
                  required
                />

                <div className="w-full">
                  <label className="mb-1 block text-sm font-medium text-neutral-700">
                    Typ
                  </label>
                  <select
                    value={formData.typ}
                    onChange={(e) => setFormData((prev) => ({ ...prev, typ: e.target.value as ZeitblockTyp }))}
                    className="block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    {ZEITBLOCK_TYPEN.map((typ) => (
                      <option key={typ.value} value={typ.value}>
                        {typ.label}
                      </option>
                    ))}
                  </select>
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
                  onChange={(e) => setFormData((prev) => ({ ...prev, dauer_minuten: parseInt(e.target.value) || 60 }))}
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
          {zeitbloecke.length === 0 ? (
            <div className="py-8 text-center text-neutral-500">
              Noch keine Zeitbloecke definiert.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                      Sortierung
                    </th>
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                      Name
                    </th>
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                      Typ
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
                  {zeitbloecke
                    .sort((a, b) => a.sortierung - b.sortierung)
                    .map((zb) => (
                      <tr key={zb.id} className="hover:bg-neutral-50">
                        <td className="py-3 text-sm text-neutral-600">
                          {zb.sortierung}
                        </td>
                        <td className="py-3 font-medium text-neutral-900">
                          {zb.name}
                        </td>
                        <td className="py-3">
                          <span className="inline-flex rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-700">
                            {ZEITBLOCK_TYPEN.find((t) => t.value === zb.typ)?.label ?? zb.typ}
                          </span>
                        </td>
                        <td className="py-3 text-sm text-neutral-600">
                          {formatOffset(zb.offset_minuten)}
                        </td>
                        <td className="py-3 text-sm text-neutral-600">
                          {zb.dauer_minuten} min
                        </td>
                        <td className="py-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-error-600 hover:text-error-700"
                            onClick={() => setDeletingId(zb.id)}
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
        title="Zeitblock entfernen"
        message="Sind Sie sicher, dass Sie diesen Zeitblock entfernen moechten?"
        confirmLabel={isDeleting ? 'Entfernen...' : 'Entfernen'}
        variant="danger"
      />
    </>
  )
}
