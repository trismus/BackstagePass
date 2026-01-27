import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUserProfile } from '@/lib/supabase/server'
import { canEdit } from '@/lib/supabase/auth-helpers'
import { getAllTemplates } from '@/lib/actions/templates'
import { TemplatesTable } from '@/components/templates/TemplatesTable'

export default async function TemplatesPage() {
  const profile = await getUserProfile()

  if (!profile) {
    redirect('/login')
  }

  // Only management (ADMIN, VORSTAND) can access templates
  if (!canEdit(profile.role)) {
    redirect('/dashboard')
  }

  const templates = await getAllTemplates()

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Aufführungs-Vorlagen</h1>
            <p className="text-gray-600 mt-1">
              Wiederverwendbare Vorlagen für Zeitblöcke, Schichten und Ressourcen
            </p>
          </div>
          <Link
            href={"/templates/neu" as never}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Neue Vorlage
          </Link>
        </div>

        {/* Templates Table */}
        <TemplatesTable templates={templates} />

        {/* Back Link */}
        <div className="mt-8">
          <Link href="/auffuehrungen" className="text-blue-600 hover:text-blue-800">
            &larr; Zurück zu Aufführungen
          </Link>
        </div>
      </div>
    </main>
  )
}
