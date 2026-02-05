'use client'

import { useState } from 'react'
import { Heart } from 'lucide-react'
import { ThankYouEmailsModal } from './ThankYouEmailsModal'

interface ThankYouEmailsButtonProps {
  veranstaltungId: string
  helferStatus: string | null
  disabled?: boolean
}

export function ThankYouEmailsButton({
  veranstaltungId,
  helferStatus,
  disabled = false,
}: ThankYouEmailsButtonProps) {
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
        className="inline-flex items-center gap-2 rounded-lg bg-pink-600 px-4 py-2 text-sm font-medium text-white hover:bg-pink-700 disabled:opacity-50"
      >
        <Heart className="h-4 w-4" />
        Dankes-Emails
      </button>

      <ThankYouEmailsModal
        open={showModal}
        veranstaltungId={veranstaltungId}
        onClose={() => setShowModal(false)}
      />
    </>
  )
}
