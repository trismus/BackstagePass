'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Alert } from '@/components/ui'
import { cancelHelferlisteRegistration } from './actions'

interface Props {
  token: string
}

export function CancellationForm({ token }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleCancel = () => {
    setError(null)

    startTransition(async () => {
      const result = await cancelHelferlisteRegistration(token)

      if (result.success) {
        setSuccess(true)
      } else {
        setError(result.error || 'Fehler beim Stornieren')
      }
    })
  }

  if (success) {
    return (
      <div className="space-y-4">
        <Alert variant="success">
          Deine Anmeldung wurde erfolgreich storniert.
        </Alert>
        <p className="text-center text-sm text-neutral-600">
          Vielen Dank, dass du uns Bescheid gegeben hast. So können wir den Platz an jemand anderen vergeben.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      <div className="rounded-lg border border-warning-200 bg-warning-50 p-4">
        <p className="text-sm text-warning-800">
          <strong>Hinweis:</strong> Durch die Stornierung wird dein Platz für andere Helfer freigegeben.
          Falls sich jemand auf der Warteliste befindet, wird diese Person automatisch nachrücken.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row-reverse">
        <Button
          onClick={handleCancel}
          disabled={isPending}
          className="bg-error-600 hover:bg-error-700"
        >
          {isPending ? 'Wird storniert...' : 'Ja, Anmeldung stornieren'}
        </Button>
        <Button
          variant="secondary"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Abbrechen
        </Button>
      </div>
    </div>
  )
}
