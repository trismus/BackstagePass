import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getEmailTemplate } from '@/lib/actions/email-templates'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button } from '@/components/ui'
import { TemplateEditor } from '@/components/admin/email-templates/TemplateEditor'
import { EMAIL_TEMPLATE_TYP_LABELS, type EmailTemplateTyp } from '@/lib/supabase/types'

export const metadata = {
  title: 'E-Mail Template bearbeiten',
  description: 'E-Mail-Vorlage bearbeiten',
}

const VALID_TYPES: EmailTemplateTyp[] = [
  'confirmation',
  'reminder_48h',
  'reminder_6h',
  'cancellation',
  'waitlist_assigned',
  'waitlist_timeout',
  'thank_you',
]

export default async function EmailTemplateEditPage({
  params,
}: {
  params: Promise<{ typ: string }>
}) {
  const { typ } = await params

  // Validate the type
  if (!VALID_TYPES.includes(typ as EmailTemplateTyp)) {
    notFound()
  }

  const template = await getEmailTemplate(typ as EmailTemplateTyp)

  if (!template) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-neutral-500">
            <Link
              href={'/admin/email-templates' as never}
              className="hover:text-primary-600"
            >
              E-Mail Templates
            </Link>
            <span>/</span>
            <span>{EMAIL_TEMPLATE_TYP_LABELS[template.typ]}</span>
          </div>
          <h1 className="mt-2 text-2xl font-semibold text-neutral-900">
            {EMAIL_TEMPLATE_TYP_LABELS[template.typ]}
          </h1>
          <p className="mt-1 text-neutral-600">
            Template für automatisierte E-Mails bearbeiten
          </p>
        </div>
        <Link href={'/admin/email-templates' as never}>
          <Button variant="secondary">Zurück zur Übersicht</Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Template bearbeiten</CardTitle>
              <CardDescription>
                Bearbeite den Betreff und den Inhalt der E-Mail-Vorlage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TemplateEditor template={template} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Verfügbare Platzhalter</CardTitle>
              <CardDescription>
                Diese Platzhalter werden beim Versand durch echte Daten ersetzt
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {template.placeholders.map((placeholder) => (
                  <div
                    key={placeholder}
                    className="flex items-center justify-between rounded bg-neutral-50 px-3 py-2"
                  >
                    <code className="text-sm text-primary-600">
                      {`{{${placeholder}}}`}
                    </code>
                    <button
                      type="button"
                      className="text-xs text-neutral-400 hover:text-neutral-600"
                      onClick={() => {
                        navigator.clipboard.writeText(`{{${placeholder}}}`)
                      }}
                    >
                      Kopieren
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hinweise</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-neutral-600">
              <p>
                <strong>HTML-Version:</strong> Wird bevorzugt angezeigt, wenn der
                E-Mail-Client HTML unterstützt.
              </p>
              <p>
                <strong>Text-Version:</strong> Wird als Fallback angezeigt, wenn
                kein HTML unterstützt wird.
              </p>
              <p>
                <strong>Platzhalter:</strong> Verwende die Syntax{' '}
                <code className="rounded bg-neutral-100 px-1">{'{{name}}'}</code>{' '}
                für dynamische Inhalte.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
