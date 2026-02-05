'use client'

import type { SchichtMitHelfer } from '@/lib/actions/koordination'

interface SchichtDetailCardProps {
  schicht: SchichtMitHelfer
  onAssign: () => void
  onRemoveHelfer: (zuweisungId: string, helferName: string) => void
}

export function SchichtDetailCard({
  schicht,
  onAssign,
  onRemoveHelfer,
}: SchichtDetailCardProps) {
  const auslastungProzent = schicht.anzahl_benoetigt > 0
    ? Math.round((schicht.anzahlBesetzt / schicht.anzahl_benoetigt) * 100)
    : 0

  const getProgressColor = () => {
    if (auslastungProzent >= 100) return 'bg-green-500'
    if (auslastungProzent >= 50) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getBorderColor = () => {
    if (auslastungProzent >= 100) return 'border-green-200'
    if (auslastungProzent >= 50) return 'border-yellow-200'
    return 'border-red-200'
  }

  return (
    <div className={`rounded-lg border ${getBorderColor()} bg-white p-4`}>
      <div className="flex items-start justify-between">
        {/* Left: Role info */}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h4 className="font-medium text-neutral-900">{schicht.rolle}</h4>
            {schicht.sichtbarkeit === 'public' && (
              <span className="rounded bg-blue-100 px-1.5 py-0.5 text-xs text-blue-700">
                Oeffentlich
              </span>
            )}
          </div>

          {/* Progress */}
          <div className="mt-2 flex items-center gap-3">
            <div className="w-24">
              <div className="h-2 overflow-hidden rounded-full bg-neutral-200">
                <div
                  className={`h-full ${getProgressColor()}`}
                  style={{ width: `${Math.min(auslastungProzent, 100)}%` }}
                />
              </div>
            </div>
            <span className="text-sm text-neutral-600">
              {schicht.anzahlBesetzt} von {schicht.anzahl_benoetigt} besetzt
            </span>
          </div>
        </div>

        {/* Right: Assign button */}
        {schicht.anzahlBesetzt < schicht.anzahl_benoetigt && (
          <button
            onClick={onAssign}
            className="rounded-lg border border-primary-300 bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-700 hover:bg-primary-100"
          >
            Helfer zuweisen
          </button>
        )}
      </div>

      {/* Helfer list */}
      {schicht.helfer.length > 0 && (
        <div className="mt-4 space-y-2">
          {schicht.helfer.map((helfer) => (
            <div
              key={helfer.zuweisungId}
              className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 text-sm font-medium text-neutral-600">
                  {helfer.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    {helfer.name}
                    {helfer.isExtern && (
                      <span className="ml-2 rounded bg-orange-100 px-1.5 py-0.5 text-xs text-orange-700">
                        Extern
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {helfer.email && (
                      <a
                        href={`mailto:${helfer.email}`}
                        className="hover:text-primary-600"
                      >
                        {helfer.email}
                      </a>
                    )}
                    {helfer.email && helfer.telefon && ' | '}
                    {helfer.telefon && (
                      <a
                        href={`tel:${helfer.telefon}`}
                        className="hover:text-primary-600"
                      >
                        {helfer.telefon}
                      </a>
                    )}
                  </p>
                </div>
              </div>

              <button
                onClick={() => onRemoveHelfer(helfer.zuweisungId, helfer.name)}
                className="rounded p-1 text-neutral-400 hover:bg-red-50 hover:text-red-600"
                title="Helfer entfernen"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty slots indicator */}
      {schicht.anzahlBesetzt < schicht.anzahl_benoetigt && (
        <div className="mt-3 flex flex-wrap gap-2">
          {Array.from({ length: schicht.anzahl_benoetigt - schicht.anzahlBesetzt }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-1 rounded-lg border border-dashed border-neutral-300 px-3 py-1.5 text-sm text-neutral-400"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Offen
            </div>
          ))}
        </div>
      )}

      {/* Waitlist */}
      {schicht.warteliste.length > 0 && (
        <div className="mt-4 border-t border-neutral-200 pt-3">
          <p className="text-sm font-medium text-neutral-700">
            Warteliste ({schicht.warteliste.length})
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {schicht.warteliste.map((w) => (
              <span
                key={w.id}
                className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs text-blue-700"
              >
                #{w.position} {w.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
