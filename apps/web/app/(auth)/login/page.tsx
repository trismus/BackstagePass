import Link from 'next/link'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata = {
  title: 'Anmelden',
  description: 'Melde dich bei BackstagePass an',
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">
            BackstagePass
          </p>
          <p className="mt-0.5 text-xs italic text-neutral-400">
            s&apos;Theater uf em Mutschelle
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-neutral-900">
            Anmelden
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Melde dich mit deinem Account an
          </p>
        </div>

        <LoginForm />

        <div className="mt-4 text-center">
          <Link
            href="/forgot-password"
            className="text-sm text-neutral-600 hover:text-neutral-900 hover:underline"
          >
            Passwort vergessen?
          </Link>
        </div>

        <p className="mt-4 text-center text-sm text-neutral-600">
          Noch kein Account?{' '}
          <Link
            href="/signup"
            className="font-medium text-neutral-900 hover:underline"
          >
            Registrieren
          </Link>
        </p>
      </div>
    </div>
  )
}
