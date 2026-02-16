'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createTemplate, updateTemplate } from '@/lib/actions/templates'
import type { AuffuehrungTemplate } from '@/lib/supabase/types'
import { Card, CardHeader, CardTitle, CardContent, CardFooter, Button, Input } from '@/components/ui'

interface TemplateFormProps {
  template?: AuffuehrungTemplate
  templateId?: string
}

export function TemplateForm({ template, templateId }: TemplateFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: template?.name ?? '',
    beschreibung: template?.beschreibung ?? '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      if (template) {
        const updateData = {
          name: formData.name.trim(),
          beschreibung: formData.beschreibung.trim() || null,
        }
        const tid = templateId || template.id
        const result = await updateTemplate(tid, updateData)
        if (!result.success) {
          setError(result.error ?? 'Fehler beim Aktualisieren')
          return
        }
        router.push(`/admin/schicht-templates/${tid}` as never)
      } else {
        const createData = {
          name: formData.name.trim(),
          beschreibung: formData.beschreibung.trim() || null,
          archiviert: false,
        }
        const result = await createTemplate(createData)
        if (!result.success) {
          setError(result.error ?? 'Fehler beim Erstellen')
          return
        }
        router.push(`/admin/schicht-templates/${result.id}` as never)
      }
    } catch (err) {
      console.error('Error saving template:', err)
      setError('Ein unerwarteter Fehler ist aufgetreten')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{template ? 'Template bearbeiten' : 'Grunddaten'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg bg-error-50 p-4 text-sm text-error-700">
              {error}
            </div>
          )}

          <Input
            label="Name"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="z.B. Abendvorstellung, Brunch, Generalprobe"
            required
          />

          <div className="w-full">
            <label
              htmlFor="beschreibung"
              className="mb-1 block text-sm font-medium text-neutral-700"
            >
              Beschreibung
            </label>
            <textarea
              id="beschreibung"
              name="beschreibung"
              value={formData.beschreibung}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, beschreibung: e.target.value }))
              }
              rows={3}
              className="block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900 placeholder-neutral-400 transition-colors focus:border-black focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-0"
              placeholder="Optionale Beschreibung des Templates..."
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between border-t border-neutral-200 px-6 py-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Abbrechen
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {template ? 'Speichern' : 'Template erstellen'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
