'use client'

import { useState } from 'react'
import { addTemplateSchicht, removeTemplateSchicht } from '@/lib/actions/templates'
import type { TemplateSchicht, TemplateZeitblock } from '@/lib/supabase/types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, ConfirmDialog } from '@/components/ui'

interface SchichtenEditorProps {
  templateId: string
  schichten: TemplateSchicht[]
  zeitbloecke: TemplateZeitblock[]
}

export function SchichtenEditor({ templateId, schichten, zeitbloecke }: SchichtenEditorProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    rolle: '',
    zeitblock_name: '',
    anzahl_benoetigt: 1,
    nur_mitglieder: false,
  })

  const resetForm = () => {
    setFormData({
      rolle: '',
      zeitblock_name: '',
      anzahl_benoetigt: 1,
      nur_mitglieder: false,
    })
    setError(null)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const result = await addTemplateSchicht({
        template_id: templateId,
        rolle: formData.rolle.trim(),
        zeitblock_name: formData.zeitblock_name || null,
        anzahl_benoetigt: formData.anzahl_benoetigt,
        nur_mitglieder: formData.nur_mitglieder,
      })

      if (!result.success) {
        setError(result.error ?? 'Fehler beim Hinzufuegen')
        return
      }

      resetForm()
      setIsAdding(false)
    } catch (err) {
      console.error('Error adding schicht:', err)
      setError('Ein unerwarteter Fehler ist aufgetreten')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingId) return

    setIsDeleting(true)
    try {
      const result = await removeTemplateSchicht(deletingId, templateId)
      if (!result.success) {
        console.error('Failed to delete schicht:', result.error)
      }
    } catch (err) {
      console.error('Error deleting schicht:', err)
    } finally {
      setIsDeleting(false)
      setDeletingId(null)
    }
  }

  // Group schichten by zeitblock_name
  const groupedSchichten = schichten.reduce(
    (acc, schicht) => {
      const key = schicht.zeitblock_name ?? 'Ohne Zeitblock'
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(schicht)
      return acc
    },
    {} as Record<string, TemplateSchicht[]>
  )

  const totalHelfer = schichten.reduce((sum, s) => sum + s.anzahl_benoetigt, 0)

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Schichten / Rollen</CardTitle>
              <CardDescription>
                {schichten.length} Schichten mit insgesamt {totalHelfer} Helfer-Slots
              </CardDescription>
            </div>
            {!isAdding && (
              <Button variant="secondary" size="sm" onClick={() => setIsAdding(true)}>
                Schicht hinzufuegen
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Add Form */}
          {isAdding && (
            <form onSubmit={handleAdd} className="mb-6 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
              <h4 className="mb-4 font-medium text-neutral-900">Neue Schicht</h4>

              {error && (
                <div className="mb-4 rounded-lg bg-error-50 p-3 text-sm text-error-700">
                  {error}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-3">
                <Input
                  label="Rolle / Taetigkeit"
                  name="rolle"
                  value={formData.rolle}
                  onChange={(e) => setFormData((prev) => ({ ...prev, rolle: e.target.value }))}
                  placeholder="z.B. Kasse, Garderobe, Bar"
                  required
                />

                <div className="w-full">
                  <label className="mb-1 block text-sm font-medium text-neutral-700">
                    Zeitblock (optional)
                  </label>
                  <select
                    value={formData.zeitblock_name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, zeitblock_name: e.target.value }))}
                    className="block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                  >
                    <option value="">Kein Zeitblock</option>
                    {zeitbloecke
                      .sort((a, b) => a.sortierung - b.sortierung)
                      .map((zb) => (
                        <option key={zb.id} value={zb.name}>
                          {zb.name}
                        </option>
                      ))}
                  </select>
                </div>

                <Input
                  label="Anzahl benoetigt"
                  name="anzahl_benoetigt"
                  type="number"
                  min={1}
                  value={formData.anzahl_benoetigt}
                  onChange={(e) => setFormData((prev) => ({ ...prev, anzahl_benoetigt: parseInt(e.target.value) || 1 }))}
                  required
                />
              </div>

              <label className="mt-3 flex items-center gap-2 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  checked={formData.nur_mitglieder}
                  onChange={(e) => setFormData((prev) => ({ ...prev, nur_mitglieder: e.target.checked }))}
                  className="rounded border-neutral-300"
                />
                Nur Vereinsmitglieder
              </label>

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
          {schichten.length === 0 ? (
            <div className="py-8 text-center text-neutral-500">
              Noch keine Schichten definiert.
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedSchichten).map(([zeitblockName, groupSchichten]) => (
                <div key={zeitblockName}>
                  <h4 className="mb-3 flex items-center gap-2 text-sm font-medium text-neutral-700">
                    <span className="rounded bg-neutral-100 px-2 py-0.5">{zeitblockName}</span>
                    <span className="text-neutral-400">
                      ({groupSchichten.reduce((sum, s) => sum + s.anzahl_benoetigt, 0)} Helfer)
                    </span>
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-neutral-200">
                          <th className="pb-2 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                            Rolle
                          </th>
                          <th className="pb-2 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                            Anzahl
                          </th>
                          <th className="pb-2 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                            Nur Mitglieder
                          </th>
                          <th className="pb-2 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">
                            Aktionen
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {groupSchichten.map((schicht) => (
                          <tr key={schicht.id} className="hover:bg-neutral-50">
                            <td className="py-2 font-medium text-neutral-900">
                              {schicht.rolle}
                            </td>
                            <td className="py-2">
                              <span className="inline-flex items-center justify-center rounded-full bg-blue-100 px-2.5 py-0.5 text-sm font-medium text-blue-800">
                                {schicht.anzahl_benoetigt}
                              </span>
                            </td>
                            <td className="py-2">
                              {schicht.nur_mitglieder ? (
                                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                                  Ja
                                </span>
                              ) : (
                                <span className="text-sm text-neutral-400">Nein</span>
                              )}
                            </td>
                            <td className="py-2 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-error-600 hover:text-error-700"
                                onClick={() => setDeletingId(schicht.id)}
                              >
                                Entfernen
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!deletingId}
        onCancel={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Schicht entfernen"
        message="Sind Sie sicher, dass Sie diese Schicht entfernen moechten?"
        confirmLabel={isDeleting ? 'Entfernen...' : 'Entfernen'}
        variant="danger"
      />
    </>
  )
}
