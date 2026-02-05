'use client'

import { useState, useEffect, useTransition } from 'react'
import { X, Phone, UserPlus, Clock, Search, Loader2 } from 'lucide-react'
import {
  findAvailableReplacements,
  assignReplacement,
  assignFromWarteliste,
  type VerfuegbarerHelfer,
  type WartelisteHelfer,
} from '@/lib/actions/ersatz-zuweisung'

type ErsatzSuchenModalProps = {
  open: boolean
  onClose: () => void
  schichtId: string
  schichtRolle: string
  zeitfenster?: { startzeit: string; endzeit: string }
  originalZuweisungId: string
  onAssigned?: () => void
}

export function ErsatzSuchenModal({
  open,
  onClose,
  schichtId,
  schichtRolle,
  zeitfenster,
  originalZuweisungId,
  onAssigned,
}: ErsatzSuchenModalProps) {
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [verfuegbar, setVerfuegbar] = useState<VerfuegbarerHelfer[]>([])
  const [warteliste, setWarteliste] = useState<WartelisteHelfer[]>([])

  // Load available replacements
  useEffect(() => {
    if (open) {
      setIsLoading(true)
      findAvailableReplacements(schichtId)
        .then((result) => {
          setVerfuegbar(result.verfuegbar)
          setWarteliste(result.warteliste)
        })
        .catch((err) => {
          console.error('Error loading replacements:', err)
          setError('Fehler beim Laden der verfuegbaren Helfer')
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
  }, [open, schichtId])

  const handleAssign = (personId: string) => {
    setError(null)
    startTransition(async () => {
      const result = await assignReplacement(
        schichtId,
        personId,
        originalZuweisungId,
        'No-Show Ersatz'
      )
      if (result.success) {
        onAssigned?.()
        onClose()
      } else {
        setError(result.error || 'Fehler beim Zuweisen')
      }
    })
  }

  const handleAssignWarteliste = (wartelisteId: string) => {
    setError(null)
    startTransition(async () => {
      const result = await assignFromWarteliste(wartelisteId, schichtId)
      if (result.success) {
        onAssigned?.()
        onClose()
      } else {
        setError(result.error || 'Fehler beim Zuweisen')
      }
    })
  }

  // Filter by search query
  const filteredVerfuegbar = verfuegbar.filter((h) => {
    if (!searchQuery) return true
    const name = `${h.person.vorname} ${h.person.nachname}`.toLowerCase()
    return name.includes(searchQuery.toLowerCase())
  })

  if (!open) return null

  const formatTime = (time: string) => time.slice(0, 5)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Ersatz finden
              </h2>
              <p className="text-sm text-gray-500">
                {schichtRolle}
                {zeitfenster &&
                  ` (${formatTime(zeitfenster.startzeit)} - ${formatTime(zeitfenster.endzeit)})`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-h-[60vh] overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </div>
              )}

              {/* Search */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Name suchen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Verfuegbare Helfer (already checked in) */}
              <div className="mb-6">
                <h3 className="mb-3 text-sm font-medium text-gray-700">
                  Verfuegbare Helfer (bereits eingecheckt)
                </h3>
                {filteredVerfuegbar.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    Keine verfuegbaren Helfer gefunden
                  </p>
                ) : (
                  <div className="space-y-2">
                    {filteredVerfuegbar.map((helfer) => (
                      <div
                        key={helfer.person.id}
                        className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {helfer.person.vorname} {helfer.person.nachname}
                          </p>
                          {helfer.aktuelleSchichten.length > 0 && (
                            <p className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              Aktuell:{' '}
                              {helfer.aktuelleSchichten
                                .map((s) => s.rolle)
                                .join(', ')}
                            </p>
                          )}
                          {helfer.person.telefon && (
                            <a
                              href={`tel:${helfer.person.telefon}`}
                              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                            >
                              <Phone className="h-3 w-3" />
                              {helfer.person.telefon}
                            </a>
                          )}
                        </div>
                        <button
                          onClick={() => handleAssign(helfer.person.id)}
                          disabled={isPending}
                          className="flex items-center gap-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                        >
                          <UserPlus className="h-4 w-4" />
                          Zuweisen
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Warteliste */}
              {warteliste.length > 0 && (
                <div>
                  <h3 className="mb-3 text-sm font-medium text-gray-700">
                    Warteliste
                  </h3>
                  <div className="space-y-2">
                    {warteliste.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between rounded-lg border border-gray-200 p-3"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            #{entry.position} {entry.person.name}
                            {entry.isExternal && (
                              <span className="ml-2 rounded bg-gray-100 px-1 text-xs text-gray-600">
                                Extern
                              </span>
                            )}
                          </p>
                          {entry.person.telefon && (
                            <a
                              href={`tel:${entry.person.telefon}`}
                              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                            >
                              <Phone className="h-3 w-3" />
                              {entry.person.telefon}
                            </a>
                          )}
                        </div>
                        <button
                          onClick={() => handleAssignWarteliste(entry.id)}
                          disabled={isPending}
                          className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          <UserPlus className="h-4 w-4" />
                          Zuweisen
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 font-medium text-gray-700 hover:bg-gray-50"
          >
            Schliessen
          </button>
        </div>
      </div>
    </div>
  )
}
