import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUserProfile } from '@/lib/supabase/server'
import { canEdit } from '@/lib/supabase/auth-helpers'
import { TemplateForm } from '@/components/templates/TemplateForm'

export default async function NeueTemplatePage() {
  const profile = await getUserProfile()

  if (!profile) {
    redirect('/login')
  }

  // Only management (ADMIN, VORSTAND) can create templates
  if (!canEdit(profile.role)) {
    redirect('/dashboard')
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Neue Vorlage</h1>
          <p className="text-gray-600 mt-1">
            Erstelle eine neue Vorlage für Aufführungen
          </p>
        </div>

        {/* Form */}
        <div className="bg-white shadow rounded-lg p-6">
          <TemplateForm mode="create" />
        </div>

        <p className="text-sm text-gray-500 mt-4">
          Nach dem Erstellen kannst du Zeitblöcke, Schichten und Ressourcen hinzufügen.
        </p>

        {/* Back Link */}
        <div className="mt-8">
          <Link href={"/templates" as never} className="text-blue-600 hover:text-blue-800">
            &larr; Zurück zu Vorlagen
          </Link>
        </div>
      </div>
    </main>
  )
}
