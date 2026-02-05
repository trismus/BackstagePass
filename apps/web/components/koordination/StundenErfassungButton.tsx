'use client'

import { useState } from 'react'
import { Clock } from 'lucide-react'
import { StundenErfassungModal } from './StundenErfassungModal'

interface StundenErfassungButtonProps {
  veranstaltungId: string
  helferStatus: string | null
  disabled?: boolean
}

export function StundenErfassungButton({
  veranstaltungId,
  helferStatus,
  disabled = false,
}: StundenErfassungButtonProps) {
  const [showModal, setShowModal] = useState(false)

  // Only show when helfer_status is 'abgeschlossen'
  if (helferStatus !== 'abgeschlossen') {
    return null
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        disabled={disabled}
        className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50"
      >
        <Clock className="h-4 w-4" />
        Stunden erfassen
      </button>

      <StundenErfassungModal
        open={showModal}
        veranstaltungId={veranstaltungId}
        onClose={() => setShowModal(false)}
      />
    </>
  )
}
