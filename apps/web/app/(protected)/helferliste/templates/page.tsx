import Link from 'next/link'
import { getHelferRollenTemplates } from '@/lib/actions/helfer-templates'
import { TemplatesTable } from '@/components/helferliste/TemplatesTable'

export const metadata = {
  title: 'Rollen-Vorlagen',
  description: 'Vorlagen für Helferrollen verwalten',
}

export default async function TemplatesPage() {
  const templates = await getHelferRollenTemplates()

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              href={'/helferliste' as never}
              className="text-sm text-primary-600 hover:text-primary-800"
            >
              &larr; Zurück zur Helferliste
            </Link>
            <h1 className="mt-4 text-2xl font-bold text-gray-900">
              Rollen-Vorlagen
            </h1>
            <p className="mt-1 text-gray-600">
              Wiederverwendbare Vorlagen für Helferrollen
            </p>
          </div>
          <Link
            href={'/helferliste/templates/neu' as never}
            className="rounded-lg bg-primary-600 px-4 py-2 font-medium text-white transition-colors hover:bg-primary-700"
          >
            + Neue Vorlage
          </Link>
        </div>

        {/* Table */}
        <TemplatesTable templates={templates} />
      </div>
    </main>
  )
}
