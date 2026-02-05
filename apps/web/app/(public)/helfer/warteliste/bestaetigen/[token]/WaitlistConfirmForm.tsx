'use client'

import { useState, useTransition } from 'react'
import { Button, Alert } from '@/components/ui'
import { confirmWaitlistByToken, rejectWaitlistByToken } from '@/lib/actions/warteliste-notification'

interface Props {
  token: string
}

export function WaitlistConfirmForm({ token }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [rejected, setRejected] = useState(false)

  const handleConfirm = () => {
    setError(null)

    startTransition(async () => {
      const result = await confirmWaitlistByToken(token)

      if (result.success) {
        setConfirmed(true)
      } else {
        setError(result.error || 'Fehler beim Bestätigen')
      }
    })
  }

  const handleReject = () => {
    setError(null)

    startTransition(async () => {
      const result = await rejectWaitlistByToken(token)

      if (result.success) {
        setRejected(true)
      } else {
        setError(result.error || 'Fehler beim Ablehnen')
      }
    })
  }

  if (confirmed) {
    return (
      <div className="space-y-4">
        <Alert variant="success">
          Perfekt! Du bist jetzt für diesen Einsatz angemeldet!
        </Alert>
        <p className="text-center text-sm text-neutral-600">
          Du erhältst eine Bestätigungs-E-Mail mit allen Details.
        </p>
      </div>
    )
  }

  if (rejected) {
    return (
      <div className="space-y-4">
        <Alert variant="info">
          Schade, dass es nicht klappt. Der Platz wird an die nächste Person auf der Warteliste vergeben.
        </Alert>
        <p className="text-center text-sm text-neutral-600">
          Vielen Dank, dass du uns Bescheid gegeben hast!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      <div className="flex flex-col gap-3">
        <Button
          onClick={handleConfirm}
          disabled={isPending}
          className="w-full bg-success-600 hover:bg-success-700"
        >
          {isPending ? 'Wird bestätigt...' : 'Ja, ich nehme den Platz!'}
        </Button>
        <Button
          variant="ghost"
          onClick={handleReject}
          disabled={isPending}
          className="w-full"
        >
          Nein, ich kann leider nicht
        </Button>
      </div>

      <p className="text-center text-xs text-neutral-500">
        Bei Fragen wende dich an das Organisationsteam.
      </p>
    </div>
  )
}
