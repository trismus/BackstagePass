'use client'

import { useState } from 'react'
import { addTemplateSachleistung, removeTemplateSachleistung } from '@/lib/actions/templates'
import type { TemplateSachleistung } from '@/lib/supabase/types'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, ConfirmDialog } from '@/components/ui'

interface SachleistungenEditorProps {
  templateId: string
  sachleistungen: TemplateSachleistung[]
}

export function SachleistungenEditor({ templateId, sachleistungen }: SachleistungenEditorProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    anzahl: 1,
    beschreibung: '',
  })

  const resetForm = () => {
    setFormData({
      name: '',
      anzahl: 1,
      beschreibung: '',
    })
    setError(null)
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const result = await addTemplateSachleistung({
        template_id: templateId,
        name: formData.name.trim(),
        anzahl: formData.anzahl,
        beschreibung: formData.beschreibung.trim() || null,
      })

      if (!result.success) {
        setError(result.error ?? 'Fehler beim Hinzufuegen')
        return
      }

      resetForm()
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
      const result = await removeTemplateSachleistung(deletingId, templateId)
      if (!result.success) {
        console.error('Failed to delete sachleistung:', result.error)
      }
    } catch (err) {
      console.error('Error deleting sachleistung:', err)
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
              <CardTitle>Sachleistungen</CardTitle>
              <CardDescription>
                Kuchen, Salate und andere Spenden von Helfern
              </CardDescription>
            </div>
            {!isAdding && (
              <Button variant="secondary" size="sm" onClick={() => setIsAdding(true)}>
                Sachleistung hinzufuegen
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

              <div className="grid gap-4 sm:grid-cols-3">
                <Input
                  label="Name"
                  name="name"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="z.B. Kuchen, Salat, Brot"
                  required
                />

                <Input
                  label="Anzahl benoetigt"
                  name="anzahl"
                  type="number"
                  min={1}
                  value={formData.anzahl}
                  onChange={(e) => setFormData((prev) => ({ ...prev, anzahl: parseInt(e.target.value) || 1 }))}
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
                    placeholder="Optionale Details..."
                  />
                </div>
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
          {sachleistungen.length === 0 ? (
            <div className="py-8 text-center text-neutral-500">
              Noch keine Sachleistungen definiert.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-200">
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                      Name
                    </th>
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                      Anzahl
                    </th>
                    <th className="pb-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                      Beschreibung
                    </th>
                    <th className="pb-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {sachleistungen.map((sl) => (
                    <tr key={sl.id} className="hover:bg-neutral-50">
                      <td className="py-3 font-medium text-neutral-900">
                        {sl.name}
                      </td>
                      <td className="py-3">
                        <span className="inline-flex items-center justify-center rounded-full bg-green-100 px-2.5 py-0.5 text-sm font-medium text-green-800">
                          {sl.anzahl}
                        </span>
                      </td>
                      <td className="max-w-xs truncate py-3 text-sm text-neutral-600">
                        {sl.beschreibung ?? '-'}
                      </td>
                      <td className="py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-error-600 hover:text-error-700"
                          onClick={() => setDeletingId(sl.id)}
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
        title="Sachleistung entfernen"
        message="Sind Sie sicher, dass Sie diese Sachleistung entfernen moechten?"
        confirmLabel={isDeleting ? 'Entfernen...' : 'Entfernen'}
        variant="danger"
      />
    </>
  )
}
