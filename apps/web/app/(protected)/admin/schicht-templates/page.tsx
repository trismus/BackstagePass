import Link from 'next/link'
import { getAllTemplates, getTemplate } from '@/lib/actions/templates'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '@/components/ui'
import { TemplateList } from '@/components/admin/templates/TemplateList'

export const metadata = {
  title: 'Schicht-Templates',
  description: 'Verwaltung von Schicht-Templates fuer Auffuehrungen',
}

export default async function SchichtTemplatesPage() {
  const templates = await getAllTemplates()

  // Fetch details for each template to get counts
  const templatesWithDetails = await Promise.all(
    templates.map(async (template) => {
      const details = await getTemplate(template.id)
      return {
        ...template,
        zeitbloeckeCount: details?.zeitbloecke?.length ?? 0,
        schichtenCount: details?.schichten?.length ?? 0,
        totalSlots: details?.schichten?.reduce((sum, s) => sum + s.anzahl_benoetigt, 0) ?? 0,
      }
    })
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">
            Schicht-Templates
          </h1>
          <p className="mt-1 text-neutral-600">
            Vorlagen fuer Helfer-Schichten bei Auffuehrungen
          </p>
        </div>
        <Link href={'/admin/schicht-templates/neu' as never}>
          <Button>Neues Template</Button>
        </Link>
      </div>

      <Card padding="none">
        <CardHeader className="px-6 pt-6">
          <CardTitle>Alle Templates</CardTitle>
          <CardDescription>
            {templates.length} Template{templates.length !== 1 ? 's' : ''} vorhanden
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TemplateList templates={templatesWithDetails} />
        </CardContent>
      </Card>
    </div>
  )
}
