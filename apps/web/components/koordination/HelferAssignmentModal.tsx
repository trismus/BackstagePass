'use client'

import { useState, useEffect, useRef } from 'react'
import { searchHelfer, validateAssignment, assignHelferManual, createExternalAndAssign } from '@/lib/actions/manual-assignment'
import { suggestPersonenForSchicht } from '@/lib/actions/schicht-vorschlaege'
import type { HelferSearchResult, AssignmentValidation } from '@/lib/actions/manual-assignment'
import type { SchichtKandidat } from '@/lib/supabase/types'
import { ConflictWarning } from '@/components/ui/ConflictWarning'

interface HelferAssignmentModalProps {
  open: boolean
  schichtId: string
  schichtRolle: string
  benoetigteSkills?: string[]
  veranstaltungId: string
  onClose: () => void
  onSuccess: () => void
}

export function HelferAssignmentModal({
  open,
  schichtId,
  schichtRolle,
  benoetigteSkills,
  veranstaltungId,
  onClose,
  onSuccess,
}: HelferAssignmentModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<HelferSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedHelfer, setSelectedHelfer] = useState<HelferSearchResult | null>(null)
  const [validation, setValidation] = useState<AssignmentValidation | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isAssigning, setIsAssigning] = useState(false)
  const [override, setOverride] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Suggestions state
  const [suggestions, setSuggestions] = useState<SchichtKandidat[]>([])
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)

  // New external helper form
  const [showNewExternalForm, setShowNewExternalForm] = useState(false)
  const [newExternal, setNewExternal] = useState({
    vorname: '',
    nachname: '',
    email: '',
    telefon: '',
  })

  // Handle dialog open/close
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open) {
      dialog.showModal()
      searchInputRef.current?.focus()
    } else {
      dialog.close()
      // Reset state
      setSearchQuery('')
      setSearchResults([])
      setSelectedHelfer(null)
      setValidation(null)
      setOverride(false)
      setError(null)
      setShowNewExternalForm(false)
      setNewExternal({ vorname: '', nachname: '', email: '', telefon: '' })
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [open])

  // Search debounce
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([])
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      try {
        const results = await searchHelfer(searchQuery, veranstaltungId)
        setSearchResults(results)
      } catch (err) {
        console.error('Search error:', err)
      } finally {
        setIsSearching(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, veranstaltungId])

  // Validate when helfer is selected
  useEffect(() => {
    if (!selectedHelfer) {
      setValidation(null)
      return
    }

    const validate = async () => {
      setIsValidating(true)
      try {
        const result = await validateAssignment(
          schichtId,
          selectedHelfer.id,
          selectedHelfer.type
        )
        setValidation(result)
      } catch (err) {
        console.error('Validation error:', err)
      } finally {
        setIsValidating(false)
      }
    }

    validate()
  }, [selectedHelfer, schichtId])

  const handleLoadSuggestions = async () => {
    setIsSuggestionsLoading(true)
    setShowSuggestions(true)
    try {
      const result = await suggestPersonenForSchicht(schichtId)
      setSuggestions(result)
    } catch (err) {
      console.error('Suggestions error:', err)
    } finally {
      setIsSuggestionsLoading(false)
    }
  }

  const handleSelectSuggestion = (kandidat: SchichtKandidat) => {
    const helferResult: HelferSearchResult = {
      id: kandidat.person_id,
      name: `${kandidat.vorname} ${kandidat.nachname}`,
      email: kandidat.email ?? '',
      telefon: null,
      type: 'intern',
      einsaetzeCount: 0,
      letzterEinsatz: null,
    }
    setSelectedHelfer(helferResult)
    setShowSuggestions(false)
    setSearchQuery('')
    setSearchResults([])
    setError(null)
  }

  const handleSelectHelfer = (helfer: HelferSearchResult) => {
    setSelectedHelfer(helfer)
    setSearchQuery('')
    setSearchResults([])
    setError(null)
  }

  const handleAssign = async () => {
    if (!selectedHelfer) return

    setIsAssigning(true)
    setError(null)

    try {
      const result = await assignHelferManual(
        schichtId,
        selectedHelfer.id,
        selectedHelfer.type,
        override
      )

      if (result.success) {
        onSuccess()
        onClose()
      } else {
        setError(result.error || 'Fehler beim Zuweisen')
      }
    } catch {
      setError('Ein unerwarteter Fehler ist aufgetreten')
    } finally {
      setIsAssigning(false)
    }
  }

  const handleCreateExternal = async () => {
    if (!newExternal.vorname || !newExternal.nachname || !newExternal.email) {
      setError('Bitte fuellen Sie alle Pflichtfelder aus')
      return
    }

    setIsAssigning(true)
    setError(null)

    try {
      const result = await createExternalAndAssign(schichtId, newExternal)

      if (result.success) {
        onSuccess()
        onClose()
      } else {
        setError(result.error || 'Fehler beim Anlegen')
      }
    } catch {
      setError('Ein unerwarteter Fehler ist aufgetreten')
    } finally {
      setIsAssigning(false)
    }
  }

  const hasSkills = benoetigteSkills && benoetigteSkills.length > 0

  if (!open) return null

  return (
    <dialog
      ref={dialogRef}
      className="fixed inset-0 z-50 m-auto max-w-lg rounded-xl border border-neutral-200 bg-white p-0 shadow-xl backdrop:bg-black/50"
      onClick={(e) => {
        if (e.target === dialogRef.current) onClose()
      }}
    >
      <div className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-neutral-900">
            Helfer zuweisen
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="mt-1 text-sm text-neutral-500">
          Schicht: <span className="font-medium">{schichtRolle}</span>
        </p>

        {/* Required skills display */}
        {hasSkills && (
          <div className="mt-2 flex flex-wrap gap-1">
            <span className="text-xs text-neutral-500">Skills:</span>
            {benoetigteSkills.map((skill) => (
              <span
                key={skill}
                className="inline-flex rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700"
              >
                {skill}
              </span>
            ))}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!showNewExternalForm ? (
          <>
            {/* Skill-based Suggestions */}
            {hasSkills && !selectedHelfer && (
              <div className="mt-4">
                {!showSuggestions ? (
                  <button
                    onClick={handleLoadSuggestions}
                    disabled={isSuggestionsLoading}
                    className="rounded-lg border border-purple-300 bg-purple-50 px-3 py-1.5 text-sm font-medium text-purple-700 hover:bg-purple-100 disabled:opacity-50"
                  >
                    Vorschlaege anzeigen
                  </button>
                ) : (
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-neutral-700">
                        Vorschlaege basierend auf Skills
                      </h3>
                      <button
                        onClick={() => setShowSuggestions(false)}
                        className="text-xs text-neutral-500 hover:text-neutral-700"
                      >
                        Ausblenden
                      </button>
                    </div>
                    {isSuggestionsLoading ? (
                      <div className="mt-2 flex items-center gap-2 text-sm text-neutral-500">
                        <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Lade Vorschlaege...
                      </div>
                    ) : suggestions.length > 0 ? (
                      <div className="mt-2 max-h-60 overflow-y-auto rounded-lg border border-neutral-200">
                        {suggestions.map((k) => (
                          <button
                            key={k.person_id}
                            onClick={() => handleSelectSuggestion(k)}
                            className="flex w-full items-start justify-between px-3 py-2 text-left hover:bg-neutral-50"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-neutral-900">
                                  {k.vorname} {k.nachname}
                                </p>
                                {/* Conflict indicator */}
                                <span
                                  className={`inline-block h-2 w-2 rounded-full ${k.has_conflicts ? 'bg-yellow-500' : 'bg-green-500'}`}
                                  title={k.has_conflicts ? 'Hat Konflikte' : 'Keine Konflikte'}
                                />
                              </div>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {k.matching_skills.map((s) => (
                                  <span key={s} className="inline-flex rounded-full bg-green-100 px-1.5 py-0.5 text-xs text-green-700">
                                    {s}
                                  </span>
                                ))}
                                {benoetigteSkills
                                  .filter((s) => !k.matching_skills.some((ms) => ms.toLowerCase() === s.toLowerCase()))
                                  .map((s) => (
                                    <span key={s} className="inline-flex rounded-full bg-neutral-100 px-1.5 py-0.5 text-xs text-neutral-500">
                                      {s}
                                    </span>
                                  ))}
                              </div>
                            </div>
                            <span className="ml-2 shrink-0 text-xs font-medium text-neutral-500">
                              {k.match_count}/{k.total_required}
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-neutral-500">
                        Keine Kandidaten gefunden.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Search */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-neutral-700">
                Helfer suchen
              </label>
              <div className="relative mt-1">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Name oder E-Mail eingeben..."
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  disabled={!!selectedHelfer}
                />
                {isSearching && (
                  <div className="absolute right-3 top-2.5">
                    <svg className="h-5 w-5 animate-spin text-neutral-400" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-neutral-200">
                  {searchResults.map((result) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleSelectHelfer(result)}
                      className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-neutral-50"
                    >
                      <div>
                        <p className="text-sm font-medium text-neutral-900">
                          {result.name}
                          <span className={`ml-2 rounded px-1.5 py-0.5 text-xs ${
                            result.type === 'intern'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-orange-100 text-orange-700'
                          }`}>
                            {result.type === 'intern' ? 'Intern' : 'Extern'}
                          </span>
                        </p>
                        <p className="text-xs text-neutral-500">{result.email}</p>
                      </div>
                      <span className="text-xs text-neutral-400">
                        {result.einsaetzeCount} Einsaetze
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Helfer */}
            {selectedHelfer && (
              <div className="mt-4 rounded-lg border border-neutral-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-neutral-900">{selectedHelfer.name}</p>
                    <p className="text-sm text-neutral-500">{selectedHelfer.email}</p>
                  </div>
                  <button
                    onClick={() => setSelectedHelfer(null)}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    Andere Person waehlen
                  </button>
                </div>

                {/* Validation */}
                {isValidating ? (
                  <div className="mt-3 flex items-center gap-2 text-sm text-neutral-500">
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Pruefe Konflikte...
                  </div>
                ) : validation && (
                  <div className="mt-3 space-y-2">
                    {/* Time conflicts */}
                    {validation.hasConflict && (
                      <div className="rounded-lg bg-yellow-50 p-3">
                        <p className="text-sm font-medium text-yellow-800">
                          Zeitkonflikt erkannt
                        </p>
                        <ul className="mt-1 space-y-1">
                          {validation.conflicts.map((c) => (
                            <li key={c.schichtId} className="text-sm text-yellow-700">
                              &quot;{c.rolle}&quot; ({c.startzeit.slice(0, 5)} - {c.endzeit.slice(0, 5)})
                              - {c.ueberschneidungMinuten} Min. Ueberschneidung
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Cross-system conflicts */}
                    {validation.crossSystemConflicts.length > 0 && (
                      <ConflictWarning conflicts={validation.crossSystemConflicts} />
                    )}

                    {/* Booking limit */}
                    {validation.bookingLimitReached && (
                      <div className="rounded-lg bg-orange-50 p-3">
                        <p className="text-sm font-medium text-orange-800">
                          Buchungslimit erreicht
                        </p>
                        <p className="text-sm text-orange-700">
                          {selectedHelfer.name} hat bereits {validation.currentBookings} von{' '}
                          {validation.maxBookings} Schichten gebucht.
                        </p>
                      </div>
                    )}

                    {/* Override checkbox */}
                    {(validation.hasConflict || validation.bookingLimitReached || validation.crossSystemConflicts.length > 0) && (
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={override}
                          onChange={(e) => setOverride(e.target.checked)}
                          className="h-4 w-4 rounded border-neutral-300 text-primary-600"
                        />
                        <span className="text-sm text-neutral-700">
                          Trotzdem zuweisen (Admin-Override)
                        </span>
                      </label>
                    )}

                    {/* No conflicts */}
                    {!validation.hasConflict && !validation.bookingLimitReached && validation.crossSystemConflicts.length === 0 && (
                      <div className="rounded-lg bg-green-50 p-3">
                        <p className="text-sm text-green-700">
                          Keine Konflikte - Zuweisung moeglich
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* New external helper link */}
            <button
              onClick={() => setShowNewExternalForm(true)}
              className="mt-4 text-sm text-primary-600 hover:text-primary-700"
            >
              + Neue externe Person anlegen
            </button>
          </>
        ) : (
          /* New External Form */
          <div className="mt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  Vorname *
                </label>
                <input
                  type="text"
                  value={newExternal.vorname}
                  onChange={(e) => setNewExternal({ ...newExternal, vorname: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">
                  Nachname *
                </label>
                <input
                  type="text"
                  value={newExternal.nachname}
                  onChange={(e) => setNewExternal({ ...newExternal, nachname: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">
                E-Mail *
              </label>
              <input
                type="email"
                value={newExternal.email}
                onChange={(e) => setNewExternal({ ...newExternal, email: e.target.value })}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">
                Telefon
              </label>
              <input
                type="tel"
                value={newExternal.telefon}
                onChange={(e) => setNewExternal({ ...newExternal, telefon: e.target.value })}
                className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
            <button
              onClick={() => setShowNewExternalForm(false)}
              className="text-sm text-neutral-600 hover:text-neutral-700"
            >
              &larr; Zurueck zur Suche
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Abbrechen
          </button>
          {showNewExternalForm ? (
            <button
              onClick={handleCreateExternal}
              disabled={isAssigning || !newExternal.vorname || !newExternal.nachname || !newExternal.email}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isAssigning ? 'Wird angelegt...' : 'Anlegen und zuweisen'}
            </button>
          ) : (
            <button
              onClick={handleAssign}
              disabled={!selectedHelfer || isAssigning || isValidating || !!(
                validation && (validation.hasConflict || validation.bookingLimitReached || validation.crossSystemConflicts.length > 0) && !override
              )}
              className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isAssigning ? 'Wird zugewiesen...' : 'Zuweisen'}
            </button>
          )}
        </div>
      </div>
    </dialog>
  )
}
