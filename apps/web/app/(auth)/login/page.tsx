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
          <h1 className="mt-2 text-2xl font-semibold text-neutral-900">
            Anmelden
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Melde dich mit deinem Account an
          </p>
        </div>

        <LoginForm />

        <p className="mt-6 text-center text-xs text-neutral-500">
          Demo: test@example.com / password
        </p>
      </div>
    </div>
  )
}
