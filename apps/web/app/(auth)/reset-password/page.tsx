import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm'

export const metadata = {
  title: 'Neues Passwort',
  description: 'Setze ein neues Passwort für deinen BackstagePass Account',
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50">
      <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">
            BackstagePass
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-neutral-900">
            Neues Passwort
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Gib dein neues Passwort ein
          </p>
        </div>

        <ResetPasswordForm />
      </div>
    </div>
  )
}
