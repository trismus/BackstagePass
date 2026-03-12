'use client'

/**
 * Tour Provider
 * Provides tour functionality throughout the application
 */

import { createContext, useContext, useCallback, useEffect, useRef } from 'react'
import { driver, type Driver, type Config } from 'driver.js'
import type { TourId } from '@/lib/tours'
import { getTourById } from '@/lib/tours'
import 'driver.js/dist/driver.css'

interface TourContextValue {
  /** Start a tour by ID */
  startTour: (tourId: TourId) => void
  /** Check if a tour is currently running */
  isTourActive: boolean
}

const TourContext = createContext<TourContextValue | undefined>(undefined)

interface TourProviderProps {
  children: React.ReactNode
}

/**
 * Tour Provider Component
 * Wraps the app and provides tour functionality
 */
export function TourProvider({ children }: TourProviderProps) {
  const driverInstanceRef = useRef<Driver | null>(null)

  const startTour = useCallback((tourId: TourId) => {
    const tourDef = getTourById(tourId)
    if (!tourDef) {
      console.warn(`Tour not found: ${tourId}`)
      return
    }

    // Destroy existing instance
    if (driverInstanceRef.current) {
      driverInstanceRef.current.destroy()
    }

    // Create driver configuration
    const config: Config = {
      showProgress: true,
      steps: tourDef.steps,
      nextBtnText: 'Weiter',
      prevBtnText: 'Zurück',
      doneBtnText: 'Fertig',
      progressText: '{{current}} von {{total}}',
      showButtons: ['next', 'previous', 'close'],
      onDestroyStarted: () => {
        if (driverInstanceRef.current) {
          driverInstanceRef.current.destroy()
          driverInstanceRef.current = null
        }
      },
      onDestroyed: () => {
        driverInstanceRef.current = null
      },
    }

    // Create and start driver
    driverInstanceRef.current = driver(config)
    driverInstanceRef.current.drive()
  }, [])

  const isTourActive = driverInstanceRef.current !== null

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (driverInstanceRef.current) {
        driverInstanceRef.current.destroy()
      }
    }
  }, [])

  return (
    <TourContext.Provider value={{ startTour, isTourActive }}>
      {children}
    </TourContext.Provider>
  )
}

/**
 * Hook to access tour functionality
 */
export function useTour() {
  const context = useContext(TourContext)
  if (context === undefined) {
    throw new Error('useTour must be used within a TourProvider')
  }
  return context
}
