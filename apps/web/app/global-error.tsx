'use client'

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="de">
      <body className="flex min-h-screen items-center justify-center bg-neutral-50 p-4">
        <div className="w-full max-w-md rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <h1 className="mb-2 text-xl font-semibold text-red-700">
            Etwas ist schiefgelaufen
          </h1>
          <p className="mb-6 text-sm text-red-600">
            Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es erneut.
          </p>
          <button
            onClick={reset}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Erneut versuchen
          </button>
        </div>
      </body>
    </html>
  )
}
