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
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">{template.name}</h1>
            {template.archiviert && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                Archiviert
              </span>
            )}
          </div>
          {template.beschreibung && (
            <p className="text-gray-600">{template.beschreibung}</p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Basic Info */}
          <div>
            <div className="bg-white shadow rounded-lg p-4">
              <h2 className="font-medium text-gray-900 mb-4">Grunddaten</h2>
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
          <Link href={"/templates" as never} className="text-blue-600 hover:text-blue-800">
            &larr; Zurück zu Vorlagen
          </Link>
        </div>
      </div>
    </main>
  )
}
