'use client'

import { useState } from 'react'
import { changePassword } from '@/app/actions/auth'
import { Button, Input, Alert } from '@/components/ui'

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    if (newPassword.length < 6) {
      setError('Neues Passwort muss mindestens 6 Zeichen lang sein')
      setLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwörter stimmen nicht überein')
      setLoading(false)
      return
    }

    const result = await changePassword(currentPassword, newPassword)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    setSuccess(true)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setLoading(false)

    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h3 className="mb-4 text-lg font-semibold text-gray-900">
        Passwort ändern
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        {success && <Alert variant="success">Passwort wurde erfolgreich geändert</Alert>}

        <Input
          label="Aktuelles Passwort"
          id="currentPassword"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="current-password"
        />

        <Input
          label="Neues Passwort"
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="new-password"
          helperText="Mindestens 6 Zeichen"
        />

        <Input
          label="Neues Passwort bestätigen"
          id="confirmNewPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="new-password"
        />

        <Button type="submit" loading={loading}>
          Passwort ändern
        </Button>
      </form>
    </div>
  )
}
