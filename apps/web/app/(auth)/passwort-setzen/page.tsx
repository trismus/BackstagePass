import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'

export const metadata = {
  title: 'Passwort festlegen',
  description: 'Lege ein Passwort für deinen BackstagePass Account fest',
}

export default function PasswortSetzenPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">
            BackstagePass
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-neutral-900">
            Passwort festlegen
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Willkommen bei BackstagePass! Lege ein Passwort für deinen Account fest.
          </p>
        </div>

        <ResetPasswordForm />
      </div>
    </div>
  )
}
