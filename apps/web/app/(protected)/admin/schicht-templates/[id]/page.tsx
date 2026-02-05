import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTemplate } from '@/lib/actions/templates'
import { TemplateForm } from '@/components/admin/templates/TemplateForm'
import { ZeitbloeckeEditor } from '@/components/admin/templates/ZeitbloeckeEditor'
import { SchichtenEditor } from '@/components/admin/templates/SchichtenEditor'
import { InfoBloeckeEditor } from '@/components/admin/templates/InfoBloeckeEditor'
import { SachleistungenEditor } from '@/components/admin/templates/SachleistungenEditor'
import { TemplatePreview } from '@/components/admin/templates/TemplatePreview'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const template = await getTemplate(id)
  return {
    title: template ? `${template.name} - Template` : 'Template nicht gefunden',
    description: template?.beschreibung ?? 'Template-Details',
  }
}

export default async function TemplateDetailPage({ params }: PageProps) {
  const { id } = await params
  const template = await getTemplate(id)

  if (!template) {
    notFound()
  }

  // Calculate preview stats
  const totalSchichten = template.schichten.length
  const totalSlots = template.schichten.reduce((sum, s) => sum + s.anzahl_benoetigt, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Link
              href={'/admin/schicht-templates' as never}
              className="text-sm text-neutral-500 hover:text-neutral-700"
            >
              Schicht-Templates
            </Link>
            <span className="text-neutral-400">/</span>
            <span className="text-sm font-medium text-neutral-900">{template.name}</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-neutral-900">
            {template.name}
          </h1>
          {template.beschreibung && (
            <p className="mt-1 text-neutral-600">{template.beschreibung}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {template.archiviert && (
            <span className="inline-flex rounded-full bg-neutral-200 px-3 py-1 text-sm font-medium text-neutral-800">
              Archiviert
            </span>
          )}
        </div>
      </div>

      {/* Preview Card */}
      <TemplatePreview
        zeitbloeckeCount={template.zeitbloecke.length}
        schichtenCount={totalSchichten}
        slotsCount={totalSlots}
        infoBloeckeCount={template.info_bloecke.length}
        sachleistungenCount={template.sachleistungen.length}
      />

      {/* Edit Grunddaten */}
      <TemplateForm template={template} />

      {/* Zeitbloecke */}
      <ZeitbloeckeEditor
        templateId={template.id}
        zeitbloecke={template.zeitbloecke}
      />

      {/* Schichten */}
      <SchichtenEditor
        templateId={template.id}
        schichten={template.schichten}
        zeitbloecke={template.zeitbloecke}
      />

      {/* Info-Bloecke */}
      <InfoBloeckeEditor
        templateId={template.id}
        infoBloecke={template.info_bloecke}
      />

      {/* Sachleistungen */}
      <SachleistungenEditor
        templateId={template.id}
        sachleistungen={template.sachleistungen}
      />
    </div>
  )
}
