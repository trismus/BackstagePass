import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Alert,
} from '@/components/ui'

export default async function HomePage() {
  const supabase = await createClient()
  const { error } = await supabase.from('personen').select('id').limit(1)

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-16 sm:py-20">
        {/* Header */}
        <header className="flex flex-col gap-6">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-neutral-500">
            BackstagePass
          </p>
          <h1 className="text-4xl font-semibold leading-tight text-neutral-900 sm:text-5xl">
            Vereinsverwaltung für Theatergruppen
          </h1>
          <p className="max-w-2xl text-lg text-neutral-600">
            Proben planen, Mitglieder verwalten und Produktionen organisieren –
            alles an einem Ort.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/login">
              <Button>Anmelden</Button>
            </Link>
            <Link href="/signup">
              <Button variant="secondary">Registrieren</Button>
            </Link>
          </div>
        </header>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          {/* Project Description */}
          <Card>
            <CardHeader>
              <CardTitle as="h2">Projektbeschreibung</CardTitle>
              <CardDescription>Was ist BackstagePass?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-neutral-600">
                BackstagePass unterstützt Theatervereine dabei, Mitglieder zu
                verwalten, Kommunikationswege zu bündeln und Produktionsdaten
                zentral zu speichern. Das Ziel ist ein übersichtliches
                Dashboard, das von der Probenplanung bis zur Premiere Klarheit
                schafft.
              </p>

              {/* Supabase Status */}
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  Supabase Status
                </p>
                {error ? (
                  <Alert variant="warning">
                    <div>
                      <span className="font-medium">Nicht verbunden</span>
                      <p className="mt-1 text-xs opacity-80">{error.message}</p>
                      <p className="mt-2 text-xs opacity-70">
                        Hinweis: Die Tabelle &quot;personen&quot; ist per RLS
                        geschützt.
                      </p>
                    </div>
                  </Alert>
                ) : (
                  <Alert variant="success">
                    Supabase ist verbunden und antwortet.
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tech Stack */}
          <Card>
            <CardHeader>
              <CardTitle as="h2">Tech Stack</CardTitle>
              <CardDescription>
                Moderne Technologien für schnelle Iteration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                  <div>
                    <p className="font-medium text-neutral-900">Next.js 15</p>
                    <p className="text-sm text-neutral-500">
                      App Router & Server Components
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                  <div>
                    <p className="font-medium text-neutral-900">Supabase</p>
                    <p className="text-sm text-neutral-500">
                      PostgreSQL, Auth & Storage
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                  <div>
                    <p className="font-medium text-neutral-900">Tailwind CSS</p>
                    <p className="text-sm text-neutral-500">
                      Utility-First Styling
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
                  <div>
                    <p className="font-medium text-neutral-900">Vercel</p>
                    <p className="text-sm text-neutral-500">
                      Hosting & Deployments
                    </p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <footer className="border-t border-neutral-200 pt-8 text-center text-sm text-neutral-500">
          <p>
            Design System:{' '}
            <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-primary">
              primary
            </code>{' '}
            (Theater-Rot) ·
            <code className="ml-2 rounded bg-neutral-100 px-1.5 py-0.5 text-secondary">
              secondary
            </code>{' '}
            (Vorhang-Lila)
          </p>
        </footer>
      </div>
    </main>
  )
}
