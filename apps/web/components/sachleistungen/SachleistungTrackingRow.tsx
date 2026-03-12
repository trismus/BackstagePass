'use client'

import { useState } from 'react'
import type { ZusageMitName } from '@/lib/supabase/types'
import { sachleistungGeliefert, sachleistungNichtGeliefert, sachleistungStornieren } from '@/lib/actions/sachleistungen'

interface SachleistungTrackingRowProps {
  zusage: ZusageMitName
}

/**
 * Admin tracking row for a single pledge.
 * Shows helper name, quantity, and toggle for delivered status.
 */
export function SachleistungTrackingRow({ zusage }: SachleistungTrackingRowProps) {
  const [isLoading, setIsLoading] = useState(false)

  const isDelivered = zusage.status === 'geliefert'
  const isCancelled = zusage.status === 'storniert'

  const handleToggleDelivered = async () => {
    setIsLoading(true)
    try {
      if (isDelivered) {
        await sachleistungNichtGeliefert(zusage.id)
      } else {
        await sachleistungGeliefert(zusage.id)
      }
    } catch (err) {
      console.error('Error toggling delivery status:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = async () => {
    setIsLoading(true)
    try {
      await sachleistungStornieren(zusage.id)
    } catch (err) {
      console.error('Error cancelling zusage:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <tr className={`border-b border-neutral-100 ${isCancelled ? 'opacity-50' : ''}`}>
      <td className="py-2.5 pr-3">
        <div>
          <span className="text-sm font-medium text-neutral-900">
            {zusage.helfer_name}
          </span>
          {zusage.helfer_email && (
            <span className="ml-2 text-xs text-neutral-500">
              {zusage.helfer_email}
            </span>
          )}
        </div>
        {zusage.kommentar && (
          <p className="mt-0.5 text-xs text-neutral-500 italic">
            {zusage.kommentar}
          </p>
        )}
      </td>
      <td className="py-2.5 text-center">
        <span className="inline-flex items-center justify-center rounded-full bg-neutral-100 px-2 py-0.5 text-sm font-medium text-neutral-700">
          {zusage.anzahl}
        </span>
      </td>
      <td className="py-2.5 text-center">
        {isCancelled ? (
          <span className="rounded-full bg-error-100 px-2 py-0.5 text-xs font-medium text-error-700">
            Storniert
          </span>
        ) : (
          <button
            type="button"
            onClick={handleToggleDelivered}
            disabled={isLoading}
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
              isDelivered
                ? 'bg-success-100 text-success-700 hover:bg-success-200'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
            }`}
          >
            {isDelivered ? 'Geliefert' : 'Offen'}
          </button>
        )}
      </td>
      <td className="py-2.5 text-right">
        {!isCancelled && !isDelivered && (
          <button
            type="button"
            onClick={handleCancel}
            disabled={isLoading}
            className="text-xs text-error-600 hover:text-error-700 disabled:opacity-50"
          >
            Stornieren
          </button>
        )}
      </td>
    </tr>
  )
}
