import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            BackstagePass
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Vereinsverwaltung für Theatergruppen
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          <Link
            href="/mockup"
            className="card hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold text-gray-900">
              Mockup-Seiten
            </h2>
            <p className="mt-2 text-gray-600">
              Klickbare Prototypen für Design-Feedback
            </p>
          </Link>

          <div className="card opacity-60">
            <h2 className="text-xl font-semibold text-gray-900">
              Dashboard
            </h2>
            <p className="mt-2 text-gray-600">
              Kommt in Phase 1 (nach Auth-Setup)
            </p>
          </div>

          <div className="card opacity-60">
            <h2 className="text-xl font-semibold text-gray-900">
              Mitglieder
            </h2>
            <p className="mt-2 text-gray-600">
              Kommt in Phase 1 (MVP Core)
            </p>
          </div>

          <div className="card opacity-60">
            <h2 className="text-xl font-semibold text-gray-900">
              Produktionen
            </h2>
            <p className="mt-2 text-gray-600">
              Kommt in Phase 2 (MVP Extended)
            </p>
          </div>
        </div>

        <div className="mt-16 rounded-lg border border-yellow-200 bg-yellow-50 p-6">
          <h3 className="font-semibold text-yellow-800">Phase 0: Foundation</h3>
          <p className="mt-2 text-sm text-yellow-700">
            Diese App befindet sich in der Entwicklung. Aktuell wird die
            Infrastruktur aufgebaut (Next.js + Supabase + Vercel).
          </p>
        </div>

        <footer className="mt-16 text-center text-sm text-gray-400">
          BackstagePass &copy; 2026
        </footer>
      </div>
    </main>
  )
}
