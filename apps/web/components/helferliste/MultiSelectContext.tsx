'use client'

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from 'react'
import type {
  RollenInstanzMitAnmeldungen,
  BookHelferSlotResult,
  HelferTimeConflict,
} from '@/lib/supabase/types'

// =============================================================================
// Types
// =============================================================================

export type WizardStep = 'select' | 'contact' | 'confirmation'

export interface MultiSelectState {
  step: WizardStep
  selectedIds: Set<string>
  contactData: { name: string; email: string; telefon: string }
  clientConflicts: HelferTimeConflict[]
  bookingResults: BookHelferSlotResult[]
  isSubmitting: boolean
  error: string | null
}

type Action =
  | { type: 'TOGGLE_ROLE'; id: string; allRollen: RollenInstanzMitAnmeldungen[]; eventDatumStart: string; eventDatumEnd: string }
  | { type: 'SET_STEP'; step: WizardStep }
  | { type: 'SET_CONTACT_DATA'; data: Partial<MultiSelectState['contactData']> }
  | { type: 'SET_SUBMITTING'; isSubmitting: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_BOOKING_RESULTS'; results: BookHelferSlotResult[]; conflicts?: HelferTimeConflict[] }
  | { type: 'RESET' }

// =============================================================================
// Client-side conflict detection
// =============================================================================

function detectClientConflicts(
  selectedIds: Set<string>,
  allRollen: RollenInstanzMitAnmeldungen[],
  eventDatumStart: string,
  eventDatumEnd: string
): HelferTimeConflict[] {
  const conflicts: HelferTimeConflict[] = []
  const selected = allRollen.filter((r) => selectedIds.has(r.id))

  for (let i = 0; i < selected.length; i++) {
    for (let j = i + 1; j < selected.length; j++) {
      const a = selected[i]
      const b = selected[j]

      const startA = a.zeitblock_start || eventDatumStart
      const endA = a.zeitblock_end || eventDatumEnd
      const startB = b.zeitblock_start || eventDatumStart
      const endB = b.zeitblock_end || eventDatumEnd

      if (startA < endB && endA > startB) {
        conflicts.push({
          instanz_a: a.id,
          rolle_a: a.template?.name || a.custom_name || 'Unbekannt',
          event_a: '',
          instanz_b: b.id,
          rolle_b: b.template?.name || b.custom_name || 'Unbekannt',
          event_b: '',
        })
      }
    }
  }

  return conflicts
}

// =============================================================================
// Reducer
// =============================================================================

const initialState: MultiSelectState = {
  step: 'select',
  selectedIds: new Set(),
  contactData: { name: '', email: '', telefon: '' },
  clientConflicts: [],
  bookingResults: [],
  isSubmitting: false,
  error: null,
}

function reducer(state: MultiSelectState, action: Action): MultiSelectState {
  switch (action.type) {
    case 'TOGGLE_ROLE': {
      const newSelected = new Set(state.selectedIds)
      if (newSelected.has(action.id)) {
        newSelected.delete(action.id)
      } else {
        newSelected.add(action.id)
      }
      const clientConflicts = detectClientConflicts(
        newSelected,
        action.allRollen,
        action.eventDatumStart,
        action.eventDatumEnd
      )
      return { ...state, selectedIds: newSelected, clientConflicts, error: null }
    }
    case 'SET_STEP':
      return { ...state, step: action.step, error: null }
    case 'SET_CONTACT_DATA':
      return {
        ...state,
        contactData: { ...state.contactData, ...action.data },
      }
    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.isSubmitting }
    case 'SET_ERROR':
      return { ...state, error: action.error }
    case 'SET_BOOKING_RESULTS':
      return {
        ...state,
        bookingResults: action.results,
        clientConflicts: action.conflicts || [],
        step: 'confirmation',
        isSubmitting: false,
      }
    case 'RESET':
      return initialState
    default:
      return state
  }
}

// =============================================================================
// Context
// =============================================================================

interface MultiSelectContextValue {
  state: MultiSelectState
  toggleRole: (id: string) => void
  setStep: (step: WizardStep) => void
  setContactData: (data: Partial<MultiSelectState['contactData']>) => void
  setSubmitting: (isSubmitting: boolean) => void
  setError: (error: string | null) => void
  setBookingResults: (results: BookHelferSlotResult[], conflicts?: HelferTimeConflict[]) => void
  reset: () => void
}

const MultiSelectContext = createContext<MultiSelectContextValue | null>(null)

export function MultiSelectProvider({
  children,
  allRollen,
  eventDatumStart,
  eventDatumEnd,
}: {
  children: ReactNode
  allRollen: RollenInstanzMitAnmeldungen[]
  eventDatumStart: string
  eventDatumEnd: string
}) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const toggleRole = useCallback(
    (id: string) =>
      dispatch({
        type: 'TOGGLE_ROLE',
        id,
        allRollen,
        eventDatumStart,
        eventDatumEnd,
      }),
    [allRollen, eventDatumStart, eventDatumEnd]
  )

  const setStep = useCallback(
    (step: WizardStep) => dispatch({ type: 'SET_STEP', step }),
    []
  )

  const setContactData = useCallback(
    (data: Partial<MultiSelectState['contactData']>) =>
      dispatch({ type: 'SET_CONTACT_DATA', data }),
    []
  )

  const setSubmitting = useCallback(
    (isSubmitting: boolean) =>
      dispatch({ type: 'SET_SUBMITTING', isSubmitting }),
    []
  )

  const setError = useCallback(
    (error: string | null) => dispatch({ type: 'SET_ERROR', error }),
    []
  )

  const setBookingResults = useCallback(
    (results: BookHelferSlotResult[], conflicts?: HelferTimeConflict[]) =>
      dispatch({ type: 'SET_BOOKING_RESULTS', results, conflicts }),
    []
  )

  const reset = useCallback(() => dispatch({ type: 'RESET' }), [])

  return (
    <MultiSelectContext.Provider
      value={{
        state,
        toggleRole,
        setStep,
        setContactData,
        setSubmitting,
        setError,
        setBookingResults,
        reset,
      }}
    >
      {children}
    </MultiSelectContext.Provider>
  )
}

export function useMultiSelect() {
  const ctx = useContext(MultiSelectContext)
  if (!ctx) {
    throw new Error('useMultiSelect must be used within MultiSelectProvider')
  }
  return ctx
}
