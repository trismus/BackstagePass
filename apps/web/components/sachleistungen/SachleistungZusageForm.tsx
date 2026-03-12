'use client'

import { useState } from 'react'
import type { SachleistungMitZusagen } from '@/lib/supabase/types'
import { sachleistungZusagenIntern, sachleistungZusagenExtern } from '@/lib/actions/sachleistungen'
import { Modal, ModalHeader, ModalBody, ModalFooter, Input, Button } from '@/components/ui'

interface SachleistungZusageFormProps {
  sachleistung: SachleistungMitZusagen
  mode: 'intern' | 'extern'
  onClose: () => void
}

/**
 * Modal form for pledging a sachleistung.
 * Supports both internal (logged-in) and external (public) helpers.
 */
export function SachleistungZusageForm({
  sachleistung,
  mode,
  onClose,
}: SachleistungZusageFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    anzahl: 1,
    kommentar: '',
    external_name: '',
    external_email: '',
    external_telefon: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      let result: { success: boolean; error?: string }

      if (mode === 'intern') {
        result = await sachleistungZusagenIntern({
          sachleistung_id: sachleistung.id,
          anzahl: formData.anzahl,
          kommentar: formData.kommentar || null,
        })
      } else {
        if (!formData.external_name.trim()) {
          setError('Name ist erforderlich')
          setIsSubmitting(false)
          return
        }
        if (!formData.external_email.trim()) {
          setError('E-Mail ist erforderlich')
          setIsSubmitting(false)
          return
        }

        result = await sachleistungZusagenExtern({
          sachleistung_id: sachleistung.id,
          external_name: formData.external_name.trim(),
          external_email: formData.external_email.trim(),
          external_telefon: formData.external_telefon.trim() || undefined,
          anzahl: formData.anzahl,
          kommentar: formData.kommentar || null,
        })
      }

      if (!result.success) {
        setError(result.error ?? 'Ein Fehler ist aufgetreten')
        return
      }

      setSuccess(true)
    } catch (err) {
      console.error('Error submitting zusage:', err)
      setError('Ein unerwarteter Fehler ist aufgetreten')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal open onClose={onClose} size="md">
      <form onSubmit={handleSubmit}>
        <ModalHeader>
          <h2 className="text-lg font-semibold text-neutral-900">
            Sachspende zusagen
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            {sachleistung.name} — noch {sachleistung.offen_anzahl} benötigt
          </p>
        </ModalHeader>

        <ModalBody>
          {success ? (
            <div className="rounded-lg bg-success-50 p-4 text-center">
              <div className="mb-2 text-2xl">&#10003;</div>
              <h3 className="font-medium text-success-800">
                Vielen Dank für deine Zusage!
              </h3>
              <p className="mt-1 text-sm text-success-600">
                Du hast {formData.anzahl}x {sachleistung.name} zugesagt.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {error && (
                <div className="rounded-lg bg-error-50 p-3 text-sm text-error-700">
                  {error}
                </div>
              )}

              {/* External helper fields */}
              {mode === 'extern' && (
                <>
                  <Input
                    label="Name *"
                    name="external_name"
                    value={formData.external_name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, external_name: e.target.value }))}
                    placeholder="Dein Name"
                    required
                  />
                  <Input
                    label="E-Mail *"
                    name="external_email"
                    type="email"
                    value={formData.external_email}
                    onChange={(e) => setFormData((prev) => ({ ...prev, external_email: e.target.value }))}
                    placeholder="deine@email.ch"
                    required
                  />
                  <Input
                    label="Telefon"
                    name="external_telefon"
                    value={formData.external_telefon}
                    onChange={(e) => setFormData((prev) => ({ ...prev, external_telefon: e.target.value }))}
                    placeholder="Optional"
                  />
                </>
              )}

              <Input
                label="Anzahl"
                name="anzahl"
                type="number"
                min={1}
                max={sachleistung.offen_anzahl}
                value={formData.anzahl}
                onChange={(e) => setFormData((prev) => ({ ...prev, anzahl: parseInt(e.target.value) || 1 }))}
              />

              <div>
                <label
                  htmlFor="kommentar"
                  className="mb-1 block text-sm font-medium text-neutral-700"
                >
                  Kommentar
                </label>
                <input
                  id="kommentar"
                  name="kommentar"
                  value={formData.kommentar}
                  onChange={(e) => setFormData((prev) => ({ ...prev, kommentar: e.target.value }))}
                  className="block w-full rounded-md border border-neutral-300 px-3 py-2 text-neutral-900 placeholder-neutral-400 focus:border-black focus:outline-none focus:ring-2 focus:ring-black"
                  placeholder="z.B. Schokoladenkuchen, glutenfrei..."
                />
              </div>
            </div>
          )}
        </ModalBody>

        <ModalFooter>
          {success ? (
            <Button type="button" onClick={onClose}>
              Schliessen
            </Button>
          ) : (
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Abbrechen
              </Button>
              <Button type="submit" loading={isSubmitting}>
                Zusagen
              </Button>
            </div>
          )}
        </ModalFooter>
      </form>
    </Modal>
  )
}
