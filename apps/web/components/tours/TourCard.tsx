'use client'

/**
 * Tour Card Component
 * Displays a tour with description and start button
 */

import { TourButton } from './TourButton'
import type { TourDefinition } from '@/lib/tours'

interface TourCardProps {
  tour: TourDefinition
}

/**
 * Tour Card
 * Shows tour information with start button
 */
export function TourCard({ tour }: TourCardProps) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="font-semibold text-neutral-900">{tour.title}</h3>
          <p className="mt-1 text-sm text-neutral-600">{tour.description}</p>
          <div className="mt-2 flex items-center gap-2 text-xs text-neutral-500">
            <span className="rounded-full bg-neutral-100 px-2 py-0.5">
              {tour.steps.length} Schritte
            </span>
            {tour.accessLevel !== 'all' && (
              <span className="rounded-full bg-primary-100 px-2 py-0.5 text-primary-700">
                {tour.accessLevel === 'management' ? 'Vorstand' : 'Admin'}
              </span>
            )}
          </div>
        </div>
        <TourButton tourId={tour.id} label="Starten" variant="ghost" size="sm" />
      </div>
    </div>
  )
}
