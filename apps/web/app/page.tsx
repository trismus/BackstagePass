import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()
  const { error } = await supabase.from('personen').select('id').limit(1)

  const connectionStatus = error
    ? {
        label: 'Fehlgeschlagen',
        detail: error.message,
      }
    : {
        label: 'Verbunden',
        detail: 'Supabase ist erreichbar und antwortet.',
      }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 py-16">
        <header className="flex flex-col gap-4">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
            BackstagePass
          </p>
          <h1 className="text-4xl font-semibold text-white sm:text-5xl">
            Vereinsverwaltung, die Proben, Mitglieder und Produktionen an einem Ort
            zusammenbringt.
          </h1>
          <p className="max-w-2xl text-lg text-slate-300">
            Dieses Deployment liefert eine schlanke Statusseite für das BackstagePass-
            Projekt. Sie zeigt den aktuellen Stand der Supabase-Anbindung sowie den
            geplanten Technologie-Stack.
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-[2fr_1fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
            <h2 className="text-xl font-semibold">Projektbeschreibung</h2>
            <p className="mt-3 text-slate-300">
              BackstagePass unterstützt Theatervereine dabei, Mitglieder zu verwalten,
              Kommunikationswege zu bündeln und Produktionsdaten zentral zu speichern.
              Das Ziel ist ein übersichtliches Dashboard, das den Vereinsalltag von der
              Probenplanung bis zur Premiere begleitet.
            </p>
            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/80 p-4">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-400">
                Supabase Status
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                    error
                      ? 'bg-rose-500/20 text-rose-200'
                      : 'bg-emerald-500/20 text-emerald-200'
                  }`}
                >
                  {connectionStatus.label}
                </span>
                <span className="text-sm text-slate-300">
                  {connectionStatus.detail}
                </span>
              </div>
              {error && (
                <p className="mt-3 text-xs text-slate-400">
                  Hinweis: Die Tabelle <span className="font-semibold">personen</span>{' '}
                  ist per RLS geschützt. Für einen erfolgreichen Check ist ein gültiger
                  Auth-Session erforderlich.
                </p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
            <h2 className="text-xl font-semibold">Tech Stack</h2>
            <ul className="mt-4 space-y-3 text-slate-300">
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-slate-500" />
                <div>
                  <p className="font-medium text-slate-100">Next.js 14</p>
                  <p className="text-sm text-slate-400">
                    App Router, Server Components und Layouts für schnelle Iteration.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-slate-500" />
                <div>
                  <p className="font-medium text-slate-100">Supabase</p>
                  <p className="text-sm text-slate-400">
                    Postgres, Auth und Storage als zentrale Datenplattform.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-slate-500" />
                <div>
                  <p className="font-medium text-slate-100">Tailwind CSS</p>
                  <p className="text-sm text-slate-400">
                    Utility-First Styling für konsistente UI-Bausteine.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-slate-500" />
                <div>
                  <p className="font-medium text-slate-100">Vercel</p>
                  <p className="text-sm text-slate-400">
                    Automatisierte Deployments und Preview-Umgebungen.
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  )
}
