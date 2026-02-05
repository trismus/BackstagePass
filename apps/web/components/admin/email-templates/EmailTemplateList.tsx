'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui'
import { toggleEmailTemplateActive } from '@/lib/actions/email-templates'
import { EMAIL_TEMPLATE_TYP_LABELS, type EmailTemplate } from '@/lib/supabase/types'

interface Props {
  templates: EmailTemplate[]
}

export function EmailTemplateList({ templates }: Props) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleToggleActive = async (typ: string) => {
    setLoading(typ)
    try {
      await toggleEmailTemplateActive(typ as EmailTemplate['typ'])
    } finally {
      setLoading(null)
    }
  }

  if (templates.length === 0) {
    return (
      <div className="px-6 py-12 text-center text-neutral-500">
        Keine Templates gefunden. Bitte führe die Datenbank-Migration aus.
      </div>
    )
  }

  return (
    <div className="divide-y divide-neutral-200">
      {templates.map((template) => (
        <div
          key={template.id}
          className="flex items-center justify-between px-6 py-4 hover:bg-neutral-50"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-medium text-neutral-900">
                {EMAIL_TEMPLATE_TYP_LABELS[template.typ]}
              </h3>
              {!template.aktiv && (
                <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                  Inaktiv
                </span>
              )}
            </div>
            <p className="mt-1 truncate text-sm text-neutral-500">
              Betreff: {template.subject}
            </p>
            <p className="mt-1 text-xs text-neutral-400">
              {template.placeholders.length} Platzhalter verfügbar
            </p>
          </div>

          <div className="ml-4 flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleToggleActive(template.typ)}
              disabled={loading === template.typ}
            >
              {loading === template.typ
                ? 'Lädt...'
                : template.aktiv
                  ? 'Deaktivieren'
                  : 'Aktivieren'}
            </Button>
            <Link href={`/admin/email-templates/${template.typ}` as never}>
              <Button variant="secondary" size="sm">
                Bearbeiten
              </Button>
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}
