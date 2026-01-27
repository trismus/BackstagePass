import Link from 'next/link'
import { TemplateForm } from '@/components/helferliste/TemplateForm'

export const metadata = {
  title: 'Neue Rollen-Vorlage',
  description: 'Neue Vorlage für Helferrollen erstellen',
}

export default function NeueTemplatePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={'/helferliste/templates' as never}
            className="text-sm text-primary-600 hover:text-primary-800"
          >
            &larr; Zurück zu Vorlagen
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">
            Neue Rollen-Vorlage
          </h1>
          <p className="mt-1 text-gray-600">
            Erstellen Sie eine wiederverwendbare Vorlage für Helferrollen
          </p>
        </div>

        {/* Form */}
        <div className="rounded-lg bg-white p-6 shadow">
          <TemplateForm />
        </div>
      </div>
    </main>
  )
}
