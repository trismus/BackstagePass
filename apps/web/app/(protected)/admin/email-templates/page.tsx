import { getAllEmailTemplates } from '@/lib/actions/email-templates'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui'
import { EmailTemplateList } from '@/components/admin/email-templates/EmailTemplateList'

export const metadata = {
  title: 'E-Mail Templates',
  description: 'Verwaltung von E-Mail-Vorlagen für automatisierte Benachrichtigungen',
}

export default async function EmailTemplatesPage() {
  const templates = await getAllEmailTemplates()

  const activeCount = templates.filter((t) => t.aktiv).length
  const totalCount = templates.length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">
          E-Mail Templates
        </h1>
        <p className="mt-1 text-neutral-600">
          Vorlagen für automatisierte Helfer-Kommunikation
        </p>
      </div>

      <Card padding="none">
        <CardHeader className="px-6 pt-6">
          <CardTitle>Alle Templates</CardTitle>
          <CardDescription>
            {activeCount} von {totalCount} Templates aktiv
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmailTemplateList templates={templates} />
        </CardContent>
      </Card>
    </div>
  )
}
