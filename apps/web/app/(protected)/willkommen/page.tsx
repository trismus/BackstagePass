import Link from 'next/link'
import { getUserProfile } from '@/lib/supabase/server'

export default async function WillkommenPage() {
  const profile = await getUserProfile()

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="text-center">
        <h1 className="text-3xl font-semibold text-neutral-900">
          Willkommen{profile?.display_name ? `, ${profile.display_name}` : ''}!
        </h1>
        <p className="mt-2 text-neutral-500">
          bei der Theatergruppe Widen
        </p>
      </div>

      {/* Info Card */}
      <div className="mx-auto max-w-2xl rounded-lg border border-neutral-200 bg-white p-8 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
          <svg className="h-8 w-8 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
          </svg>
        </div>
        <h2 className="text-xl font-medium text-neutral-900">
          Schön, dass du da bist!
        </h2>
        <p className="mt-3 text-neutral-500">
          Als Freund der Theatergruppe kannst du unsere öffentlichen Veranstaltungen
          einsehen und auf dem Laufenden bleiben.
        </p>
      </div>

      {/* Quick Links */}
      <div className="mx-auto max-w-2xl">
        <h3 className="mb-4 text-lg font-medium text-neutral-900">Das kannst du tun:</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/veranstaltungen"
            className="rounded-lg border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100">
                <svg className="h-5 w-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-neutral-900">Veranstaltungen</p>
                <p className="text-sm text-neutral-500">Alle Events im Überblick</p>
              </div>
            </div>
          </Link>

          <Link
            href="/profile"
            className="rounded-lg border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-100">
                <svg className="h-5 w-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-neutral-900">Mein Profil</p>
                <p className="text-sm text-neutral-500">Daten bearbeiten</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* CTA */}
      <div className="mx-auto max-w-2xl rounded-lg border border-neutral-200 bg-neutral-50 p-6 text-center">
        <h3 className="font-medium text-neutral-900">Interesse am Mitmachen?</h3>
        <p className="mt-1 text-sm text-neutral-500">
          Wir freuen uns immer über neue Mitglieder und Helfer!
        </p>
        <p className="mt-3 text-sm text-neutral-500">
          Kontaktiere uns unter{' '}
          <a href="mailto:vorstand@tgwiden.ch" className="font-medium text-neutral-900 hover:underline">
            vorstand@tgwiden.ch
          </a>
        </p>
      </div>
    </div>
  )
}
