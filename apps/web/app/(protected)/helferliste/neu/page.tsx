import Link from 'next/link'
import { HelferEventForm } from '@/components/helferliste/HelferEventForm'

export const metadata = {
  title: 'Neuer Helfer-Event',
  description: 'Neuen Helfer-Event erstellen',
}

export default function NeuerHelferEventPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={'/helferliste' as never}
            className="text-sm text-primary-600 hover:text-primary-800"
          >
            &larr; Zurück zur Helferliste
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            Neuer Helfer-Event
          </h1>
          <p className="mt-1 text-gray-600">
            Erstellen Sie einen neuen Event, für den Helfer benötigt werden
          </p>
        </div>

        {/* Form */}
        <div className="rounded-lg bg-white p-6 shadow">
          <HelferEventForm />
        </div>
      </div>
    </main>
  )
}
