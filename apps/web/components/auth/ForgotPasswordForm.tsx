'use client'

import { useState } from 'react'
import { resetPasswordRequest } from '@/app/actions/auth'
import { Button, Input, Alert } from '@/components/ui'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    const result = await resetPasswordRequest(email)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  if (success) {
    return (
      <Alert variant="success">
        Wir haben dir eine E-Mail mit einem Link zum Zurücksetzen deines
        Passworts gesendet. Bitte überprüfe dein Postfach.
      </Alert>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <Alert variant="error">{error}</Alert>}

      <Input
        label="E-Mail"
        id="email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="name@beispiel.de"
        required
        autoComplete="email"
        helperText="Gib die E-Mail-Adresse ein, mit der du dich registriert hast."
      />

      <Button type="submit" loading={loading} className="w-full">
        Link senden
      </Button>
    </form>
  )
}
