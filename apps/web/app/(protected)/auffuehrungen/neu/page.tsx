import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUserProfile } from '@/lib/supabase/server'
import { canEdit } from '@/lib/supabase/auth-helpers'
import { VeranstaltungForm } from '@/components/veranstaltungen/VeranstaltungForm'
import { getTemplates } from '@/lib/actions/templates'
import { TemplateApplySelector } from '@/components/templates/TemplateApplySelector'

export default async function NeueAuffuehrungPage() {
  const profile = await getUserProfile()

  if (!profile) {
    redirect('/login')
  }

  // Only management (ADMIN, VORSTAND) can create
  if (!canEdit(profile.role)) {
    redirect('/auffuehrungen')
  }

  const templates = await getTemplates()

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Neue Aufführung</h1>
          <p className="text-gray-600 mt-1">
            Erstelle eine neue Aufführung mit Zeitblöcken und Schichten
          </p>
        </div>

        {/* Template Selector */}
        {templates.length > 0 && (
          <div className="mb-6">
            <TemplateApplySelector templates={templates} mode="create" />
          </div>
        )}

        {/* Form */}
        <div className="bg-white shadow rounded-lg p-6">
          <VeranstaltungForm mode="create" fixedTyp="auffuehrung" returnUrl="/auffuehrungen" />
        </div>

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
