import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { getUserProfile } from '@/lib/supabase/server'
import { canEdit } from '@/lib/supabase/auth-helpers'
import { getTemplate } from '@/lib/actions/templates'
import { getAktiveRessourcen } from '@/lib/actions/ressourcen'
import { TemplateForm } from '@/components/templates/TemplateForm'
import { TemplateDetailEditor } from '@/components/templates/TemplateDetailEditor'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function TemplateDetailPage({ params }: PageProps) {
  const profile = await getUserProfile()

  if (!profile) {
    redirect('/login')
  }

  // Only management (ADMIN, VORSTAND) can access templates
  if (!canEdit(profile.role)) {
    redirect('/dashboard')
  }

  const { id } = await params
  const [template, ressourcen] = await Promise.all([
    getTemplate(id),
    getAktiveRessourcen(),
  ])

  if (!template) {
    notFound()
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {template.name}
            </h1>
            {template.archiviert && (
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                Archiviert
              </span>
            )}
          </div>
          {template.beschreibung && (
            <p className="text-gray-600">{template.beschreibung}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left Column - Basic Info */}
          <div>
            <div className="rounded-lg bg-white p-4 shadow">
              <h2 className="mb-4 font-medium text-gray-900">Grunddaten</h2>
              <TemplateForm template={template} mode="edit" />
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="lg:col-span-2">
            <TemplateDetailEditor template={template} ressourcen={ressourcen} />
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-8">
          <Link
            href={'/templates' as never}
            className="text-blue-600 hover:text-blue-800"
          >
            &larr; Zurück zu Vorlagen
          </Link>
        </div>
      </div>
    </main>
  )
}
