'use client'

import Link from 'next/link'

export default function AuffuehrungenError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border border-error-200 bg-error-50 p-8 text-center">
        <h2 className="mb-2 text-xl font-semibold text-error-700">
          Fehler beim Laden der Aufführungen
        </h2>
        <p className="mb-6 text-sm text-error-700">
          Die Aufführungen konnten nicht geladen werden. Bitte versuche es erneut.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="rounded-lg bg-error-600 px-4 py-2 text-sm font-medium text-white hover:bg-error-700"
          >
            Erneut versuchen
          </button>
          <Link
            href={'/dashboard' as never}
            className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            Zum Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
