'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createGruppe, updateGruppe } from '@/lib/actions/gruppen'
import type { Gruppe, GruppenTyp, Stueck } from '@/lib/supabase/types'
import { GRUPPEN_TYP_LABELS } from '@/lib/supabase/types'

interface GruppeFormProps {
  gruppe?: Gruppe
  stuecke?: Pick<Stueck, 'id' | 'titel'>[]
}

export function GruppeForm({ gruppe, stuecke = [] }: GruppeFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const isEditing = !!gruppe

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name') as string,
      typ: formData.get('typ') as GruppenTyp,
      beschreibung: (formData.get('beschreibung') as string) || null,
      stueck_id: (formData.get('stueck_id') as string) || null,
      aktiv: formData.get('aktiv') === 'on',
    }

    startTransition(async () => {
      const result = isEditing
        ? await updateGruppe(gruppe.id, data)
        : await createGruppe(data)

      if (!result.success) {
        setError(result.error || 'Ein Fehler ist aufgetreten')
        return
      }

      router.push('/admin/gruppen' as never)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Name */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-neutral-700"
        >
          Name *
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          defaultValue={gruppe?.name || ''}
          className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="z.B. Technik-Team"
        />
      </div>

      {/* Typ */}
      <div>
        <label
          htmlFor="typ"
          className="block text-sm font-medium text-neutral-700"
        >
          Typ *
        </label>
        <select
          id="typ"
          name="typ"
          required
          defaultValue={gruppe?.typ || 'team'}
          className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {(Object.keys(GRUPPEN_TYP_LABELS) as GruppenTyp[]).map((typ) => (
            <option key={typ} value={typ}>
              {GRUPPEN_TYP_LABELS[typ]}
            </option>
          ))}
        </select>
      </div>

      {/* Beschreibung */}
      <div>
        <label
          htmlFor="beschreibung"
          className="block text-sm font-medium text-neutral-700"
        >
          Beschreibung
        </label>
        <textarea
          id="beschreibung"
          name="beschreibung"
          rows={3}
          defaultValue={gruppe?.beschreibung || ''}
          className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Optionale Beschreibung der Gruppe"
        />
      </div>

      {/* Stück (für Produktions-Gruppen) */}
      <div>
        <label
          htmlFor="stueck_id"
          className="block text-sm font-medium text-neutral-700"
        >
          Verknüpftes Stück
        </label>
        <select
          id="stueck_id"
          name="stueck_id"
          defaultValue={gruppe?.stueck_id || ''}
          className="mt-1 block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <option value="">Kein Stück</option>
          {stuecke.map((stueck) => (
            <option key={stueck.id} value={stueck.id}>
              {stueck.titel}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-neutral-500">
          Für Produktions-Gruppen (z.B. Cast) kann ein Stück verknüpft werden
        </p>
      </div>

      {/* Aktiv */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="aktiv"
          name="aktiv"
          defaultChecked={gruppe?.aktiv ?? true}
          className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
        />
        <label htmlFor="aktiv" className="text-sm text-neutral-700">
          Gruppe ist aktiv
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-3 border-t border-neutral-200 pt-6">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {isPending
            ? 'Speichern...'
            : isEditing
              ? 'Änderungen speichern'
              : 'Gruppe erstellen'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-neutral-300 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
        >
          Abbrechen
        </button>
      </div>
    </form>
  )
}
