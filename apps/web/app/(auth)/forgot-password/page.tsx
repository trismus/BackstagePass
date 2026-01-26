import Link from 'next/link'
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm'

export const metadata = {
  title: 'Passwort vergessen',
  description: 'Setze dein BackstagePass Passwort zurück',
}

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">
            BackstagePass
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-neutral-900">
            Passwort vergessen
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Kein Problem, wir senden dir einen Reset-Link
          </p>
        </div>

        <ForgotPasswordForm />

        <p className="mt-6 text-center text-sm text-neutral-600">
          <Link
            href="/login"
            className="font-medium text-neutral-900 hover:underline"
          >
            Zurück zur Anmeldung
          </Link>
        </p>
      </div>
    </div>
  )
}
