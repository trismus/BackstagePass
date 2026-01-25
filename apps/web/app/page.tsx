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
    <main className="min-h-screen bg-white text-neutral-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-6 py-16 sm:py-20">
        <header className="flex flex-col gap-6">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">
            BackstagePass
          </p>
          <h1 className="text-4xl font-semibold leading-tight text-neutral-950 sm:text-5xl lg:text-6xl">
            Vereinsverwaltung mit klarer Struktur für Proben, Mitglieder und
            Produktionen.
          </h1>
          <p className="max-w-2xl text-lg text-neutral-600">
            Dieses Deployment zeigt die neue, uber-inspirierte Designrichtung: viel
            Weißraum, reduzierte Flächen und eine klare Typografie für schnelle
            Orientierung im Alltag des Vereins.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500">
            <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              UI Richtung: Minimal + Editorial
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-3 py-1">
              Farben anpassbar im Admin (später)
            </span>
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[2.1fr_1fr]">
          <div className="rounded-3xl border border-neutral-200 bg-white p-8 shadow-[0_20px_60px_-40px_rgba(15,23,42,0.35)]">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-neutral-900">
                Projektbeschreibung
              </h2>
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-400">
                Overview
              </span>
            </div>
            <p className="mt-4 text-base leading-relaxed text-neutral-600">
              BackstagePass unterstützt Theatervereine dabei, Mitglieder zu verwalten,
              Kommunikationswege zu bündeln und Produktionsdaten zentral zu speichern.
              Das Ziel ist ein übersichtliches Dashboard, das von der Probenplanung bis
              zur Premiere Klarheit schafft.
            </p>

            <div className="mt-8 rounded-2xl border border-neutral-200 bg-neutral-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neutral-500">
                Supabase Status
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
                    error
                      ? 'bg-rose-100 text-rose-600'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {connectionStatus.label}
                </span>
                <span className="text-sm text-neutral-600">
                  {connectionStatus.detail}
                </span>
              </div>
              {error && (
                <p className="mt-3 text-xs text-neutral-500">
                  Hinweis: Die Tabelle <span className="font-semibold">personen</span>{' '}
                  ist per RLS geschützt. Für einen erfolgreichen Check ist ein gültiger
                  Auth-Session erforderlich.
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6 rounded-3xl border border-neutral-200 bg-white p-8">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">Tech Stack</h2>
              <p className="mt-2 text-sm text-neutral-500">
                Fokus auf schnelle Iteration, klare Struktur und stabile Datenbasis.
              </p>
            </div>
            <ul className="space-y-4 text-neutral-600">
              <li className="flex items-start gap-3">
                <span className="mt-2 h-2 w-2 rounded-full bg-neutral-400" />
                <div>
                  <p className="font-medium text-neutral-900">Next.js 14</p>
                  <p className="text-sm text-neutral-500">
                    App Router, Server Components und Layouts für schnelle Iteration.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 h-2 w-2 rounded-full bg-neutral-400" />
                <div>
                  <p className="font-medium text-neutral-900">Supabase</p>
                  <p className="text-sm text-neutral-500">
                    Postgres, Auth und Storage als zentrale Datenplattform.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 h-2 w-2 rounded-full bg-neutral-400" />
                <div>
                  <p className="font-medium text-neutral-900">Tailwind CSS</p>
                  <p className="text-sm text-neutral-500">
                    Utility-First Styling für konsistente UI-Bausteine.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 h-2 w-2 rounded-full bg-neutral-400" />
                <div>
                  <p className="font-medium text-neutral-900">Vercel</p>
                  <p className="text-sm text-neutral-500">
                    Automatisierte Deployments und Preview-Umgebungen.
                  </p>
                </div>
              </li>
            </ul>
            <div className="mt-auto rounded-2xl border border-neutral-200 px-4 py-3 text-xs text-neutral-500">
              Design-Token: Primary #111111 · Accent #2EBD85 · Radius 24px
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
