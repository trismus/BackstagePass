'use client'

import { useState, useTransition } from 'react'
import { Button, Input, Alert } from '@/components/ui'
import { updateProfile } from '@/app/actions/profile'

interface ProfileEditFormProps {
  initialDisplayName: string | null
  email: string
  role: string
}

export function ProfileEditForm({
  initialDisplayName,
  email,
  role,
}: ProfileEditFormProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName || '')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    startTransition(async () => {
      const result = await updateProfile(displayName)

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">Profil erfolgreich aktualisiert!</Alert>}

      <div className="space-y-4">
        <Input
          label="E-Mail"
          type="email"
          value={email}
          disabled
          helperText="Die E-Mail-Adresse kann nicht geändert werden"
        />

        <Input
          label="Anzeigename"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Dein Name"
          required
        />

        <div>
          <label className="block text-sm font-medium text-neutral-700">
            Rolle
          </label>
          <div className="mt-1">
            <span className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-800">
              {role}
            </span>
          </div>
          <p className="mt-1 text-sm text-neutral-500">
            Die Rolle kann nur von einem Admin geändert werden
          </p>
        </div>
      </div>

      <Button type="submit" isLoading={isPending} disabled={isPending}>
        Speichern
      </Button>
    </form>
  )
}
