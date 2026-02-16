'use client'

import { useState } from 'react'
import { addTemplateInfoBlock, removeTemplateInfoBlock, updateTemplateInfoBlock } from '@/lib/actions/templates'
import type { TemplateInfoBlock } from '@/lib/supabase/types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, ConfirmDialog } from '@/components/ui'

interface InfoBloeckeEditorProps {
  templateId: string
  infoBloecke: TemplateInfoBlock[]
}

export function InfoBloeckeEditor({ templateId, infoBloecke }: InfoBloeckeEditorProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isEditSubmitting, setIsEditSubmitting] = useState(false)
  const [editError, setEditError] = useState<string | null>(null)
  const [editData, setEditData] = useState({
    titel: '',
    beschreibung: '',
    startzeit: '',
    endzeit: '',
  })

  const [formData, setFormData] = useState({
    titel: '',
    beschreibung: '',
    startzeit: '18:00',
    endzeit: '18:30',
    sortierung: infoBloecke.length,
  })

  const resetForm = () => {
    setFormData({
      titel: '',
      beschreibung: '',
      startzeit: '18:00',
      endzeit: '18:30',
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
        startzeit: formData.startzeit,
        endzeit: formData.endzeit,
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

  const startEdit = (ib: TemplateInfoBlock) => {
    setEditingId(ib.id)
    setEditData({
      titel: ib.titel,
      beschreibung: ib.beschreibung ?? '',
      startzeit: ib.startzeit,
      endzeit: ib.endzeit,
    })
    setEditError(null)
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId) return

    setIsEditSubmitting(true)
    setEditError(null)

    try {
      const result = await updateTemplateInfoBlock(editingId, templateId, {
        titel: editData.titel.trim(),
        beschreibung: editData.beschreibung.trim() || null,
        startzeit: editData.startzeit,
        endzeit: editData.endzeit,
      })

      if (!result.success) {
        setEditError(result.error ?? 'Fehler beim Aktualisieren')
        return
      }

      setEditingId(null)
    } catch (err) {
      console.error('Error updating info block:', err)
      setEditError('Ein unerwarteter Fehler ist aufgetreten')
    } finally {
      setIsEditSubmitting(false)
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
                  label="Startzeit"
                  name="startzeit"
                  type="time"
                  value={formData.startzeit}
                  onChange={(e) => setFormData((prev) => ({ ...prev, startzeit: e.target.value }))}
                  required
                />

                <Input
                  label="Endzeit"
                  name="endzeit"
                  type="time"
                  value={formData.endzeit}
                  onChange={(e) => setFormData((prev) => ({ ...prev, endzeit: e.target.value }))}
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
                      Startzeit
                    </th>
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                      Endzeit
                    </th>
                    <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {infoBloecke
                    .sort((a, b) => a.sortierung - b.sortierung)
                    .map((ib, index) =>
                      editingId === ib.id ? (
                        <tr key={ib.id}>
                          <td colSpan={6} className="p-0">
                            <form onSubmit={handleEdit} className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                              {editError && (
                                <div className="mb-4 rounded-lg bg-error-50 p-3 text-sm text-error-700">
                                  {editError}
                                </div>
                              )}
                              <div className="grid gap-4 sm:grid-cols-2">
                                <Input
                                  label="Titel"
                                  name="edit-titel"
                                  value={editData.titel}
                                  onChange={(e) => setEditData((prev) => ({ ...prev, titel: e.target.value }))}
                                  required
                                />
                                <div className="w-full">
                                  <label
                                    htmlFor="edit-beschreibung"
                                    className="mb-1 block text-sm font-medium text-neutral-700"
                                  >
                                    Beschreibung
                                  </label>
                                  <input
                                    id="edit-beschreibung"
                                    name="edit-beschreibung"
                                    value={editData.beschreibung}
                                    onChange={(e) => setEditData((prev) => ({ ...prev, beschreibung: e.target.value }))}
                                    className="block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                                    placeholder="Optionale Beschreibung..."
                                  />
                                </div>
                                <Input
                                  label="Startzeit"
                                  name="edit-startzeit"
                                  type="time"
                                  value={editData.startzeit}
                                  onChange={(e) => setEditData((prev) => ({ ...prev, startzeit: e.target.value }))}
                                  required
                                />
                                <Input
                                  label="Endzeit"
                                  name="edit-endzeit"
                                  type="time"
                                  value={editData.endzeit}
                                  onChange={(e) => setEditData((prev) => ({ ...prev, endzeit: e.target.value }))}
                                  required
                                />
                              </div>
                              <div className="mt-4 flex justify-end gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingId(null)}
                                  disabled={isEditSubmitting}
                                >
                                  Abbrechen
                                </Button>
                                <Button type="submit" size="sm" loading={isEditSubmitting}>
                                  Speichern
                                </Button>
                              </div>
                            </form>
                          </td>
                        </tr>
                      ) : (
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
                            {ib.startzeit}
                          </td>
                          <td className="py-3 text-sm text-neutral-600">
                            {ib.endzeit}
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEdit(ib)}
                              >
                                Bearbeiten
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-error-600 hover:text-error-700"
                                onClick={() => setDeletingId(ib.id)}
                              >
                                Entfernen
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    )}
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
