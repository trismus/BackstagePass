'use client'

interface SuccessScreenProps {
  schichtName: string
  veranstaltungName: string
  onRegisterMore: () => void
}

export function SuccessScreen({
  schichtName,
  veranstaltungName,
  onRegisterMore,
}: SuccessScreenProps) {
  return (
    <div className="rounded-xl border border-success-200 bg-white p-8 text-center shadow-sm">
      {/* Success Icon */}
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success-100">
        <svg
          className="h-8 w-8 text-success-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>

      {/* Message */}
      <h2 className="text-xl font-semibold text-gray-900">
        Deine Anmeldung wurde gespeichert!
      </h2>

      <p className="mt-3 text-gray-600">
        Du hast dich erfolgreich für{' '}
        <span className="font-medium text-gray-900">&quot;{schichtName}&quot;</span>{' '}
        bei{' '}
        <span className="font-medium text-gray-900">&quot;{veranstaltungName}&quot;</span>{' '}
        angemeldet.
      </p>

      {/* Email Notice */}
      <div className="mt-6 rounded-lg bg-gray-50 p-4">
        <p className="text-sm text-gray-600">
          Du erhältst in Kürze eine Bestätigung per E-Mail.
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Falls du die E-Mail nicht erhältst, prüfe bitte deinen Spam-Ordner.
        </p>
      </div>

      {/* Actions */}
      <div className="mt-8">
        <button
          onClick={onRegisterMore}
          className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-3 font-medium text-white transition-colors hover:bg-primary-700"
        >
          <svg
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Weitere Schicht buchen
        </button>
      </div>
    </div>
  )
}
