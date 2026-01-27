'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteRollenInstanz } from '@/lib/actions/helferliste'

interface RolleActionsProps {
  rolleId: string
}

export function RolleActions({ rolleId }: RolleActionsProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (
      !confirm(
        'Rolle wirklich löschen? Alle Anmeldungen werden ebenfalls gelöscht.'
      )
    ) {
      return
    }

    setIsDeleting(true)
    const result = await deleteRollenInstanz(rolleId)
    if (!result.success) {
      alert(result.error || 'Fehler beim Löschen')
      setIsDeleting(false)
      return
    }

    router.refresh()
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isDeleting}
      className="rounded p-1.5 text-gray-400 transition-colors hover:bg-error-50 hover:text-error-600 disabled:opacity-50"
      title="Rolle löschen"
    >
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
      </svg>
    </button>
  )
}
