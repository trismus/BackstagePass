'use client'

import { useState } from 'react'
import { FeedbackDialog } from './FeedbackDialog'

interface FeedbackButtonProps {
  userName: string | null
  userEmail: string | undefined
  userRole: string
}

export function FeedbackButton({
  userName: _userName,
  userEmail: _userEmail,
  userRole: _userRole,
}: FeedbackButtonProps) {
  const [showDialog, setShowDialog] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setShowDialog(true)}
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary-600 text-white shadow-lg transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        aria-label="Feedback geben"
        title="Feedback geben"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>
      <FeedbackDialog open={showDialog} onClose={() => setShowDialog(false)} />
    </>
  )
}
