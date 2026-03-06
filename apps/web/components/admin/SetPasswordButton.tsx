'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui'
import { adminSetPassword } from '@/app/actions/profile'

interface SetPasswordButtonProps {
  userId: string
  userEmail?: string | null
  className?: string
}

export function SetPasswordButton({
  userId,
  userEmail,
  className = '',
}: SetPasswordButtonProps) {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  function resetForm() {
    setPassword('')
    setConfirmPassword('')
    setError('')
    setSuccess(false)
  }

  function handleClose() {
    setOpen(false)
    resetForm()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Passwort muss mindestens 6 Zeichen lang sein')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwörter stimmen nicht überein')
      return
    }

    setLoading(true)
    const result = await adminSetPassword(userId, password)
    setLoading(false)

    if (result.error) {
      setError(result.error)
      return
    }

    setSuccess(true)
    setTimeout(() => {
      handleClose()
    }, 1500)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`text-sm text-primary-600 hover:text-primary-800 ${className}`}
      >
        Passwort setzen
      </button>

      <Modal
        open={open}
        onClose={handleClose}
        title="Passwort setzen"
        description={
          userEmail
            ? `Neues Passwort für ${userEmail} setzen`
            : 'Neues Passwort für diesen Benutzer setzen'
        }
        size="sm"
        footer={
          !success ? (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-100"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                form="set-password-form"
                disabled={loading}
                className="rounded-lg bg-primary-600 px-4 py-2 text-sm text-white hover:bg-primary-700 disabled:opacity-50"
              >
                {loading ? 'Wird gesetzt...' : 'Passwort setzen'}
              </button>
            </>
          ) : undefined
        }
      >
        {success ? (
          <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800">
            Passwort wurde erfolgreich gesetzt.
          </div>
        ) : (
          <form id="set-password-form" onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
                {error}
              </div>
            )}
            <div>
              <label
                htmlFor="new-password"
                className="mb-1 block text-sm font-medium text-neutral-700"
              >
                Neues Passwort
              </label>
              <input
                id="new-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label
                htmlFor="confirm-password"
                className="mb-1 block text-sm font-medium text-neutral-700"
              >
                Passwort bestätigen
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </form>
        )}
      </Modal>
    </>
  )
}
