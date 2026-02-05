'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Input, Alert } from '@/components/ui'
import {
  updateEmailTemplate,
  resetEmailTemplateToDefault,
  previewTemplateContent,
} from '@/lib/actions/email-templates'
import { TemplatePreview } from './TemplatePreview'
import type { EmailTemplate } from '@/lib/supabase/types'

interface Props {
  template: EmailTemplate
}

type Tab = 'subject' | 'html' | 'text'

export function TemplateEditor({ template }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [subject, setSubject] = useState(template.subject)
  const [bodyHtml, setBodyHtml] = useState(template.body_html)
  const [bodyText, setBodyText] = useState(template.body_text)
  const [activeTab, setActiveTab] = useState<Tab>('subject')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState<{
    subject: string
    html: string
    text: string
  } | null>(null)

  const hasChanges =
    subject !== template.subject ||
    bodyHtml !== template.body_html ||
    bodyText !== template.body_text

  const handleSave = () => {
    setError(null)
    setSuccess(false)

    startTransition(async () => {
      const result = await updateEmailTemplate(template.typ, {
        subject,
        body_html: bodyHtml,
        body_text: bodyText,
      })

      if (result.success) {
        setSuccess(true)
        router.refresh()
        setTimeout(() => setSuccess(false), 3000)
      } else {
        setError(result.error || 'Fehler beim Speichern')
      }
    })
  }

  const handleReset = () => {
    if (!confirm('Template auf Standardwerte zurücksetzen? Alle Änderungen gehen verloren.')) {
      return
    }

    setError(null)
    setSuccess(false)

    startTransition(async () => {
      const result = await resetEmailTemplateToDefault(template.typ)

      if (result.success) {
        setSuccess(true)
        router.refresh()
        // Reload page to get fresh data
        window.location.reload()
      } else {
        setError(result.error || 'Fehler beim Zurücksetzen')
      }
    })
  }

  const handlePreview = () => {
    startTransition(async () => {
      const preview = await previewTemplateContent(subject, bodyHtml, bodyText)
      setPreviewData(preview)
      setShowPreview(true)
    })
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'subject', label: 'Betreff' },
    { id: 'html', label: 'HTML-Inhalt' },
    { id: 'text', label: 'Text-Inhalt' },
  ]

  return (
    <div className="space-y-6">
      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">Erfolgreich gespeichert!</Alert>}

      {/* Tab Navigation */}
      <div className="border-b border-neutral-200">
        <nav className="-mb-px flex space-x-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 px-1 py-2 text-sm font-medium ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'subject' && (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="subject"
                className="mb-1 block text-sm font-medium text-neutral-700"
              >
                E-Mail-Betreff
              </label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Betreff der E-Mail..."
                className="w-full"
              />
            </div>
            <p className="text-sm text-neutral-500">
              Der Betreff erscheint in der E-Mail-Vorschau und Benachrichtigungen.
              Verwende Platzhalter wie{' '}
              <code className="rounded bg-neutral-100 px-1">{'{{veranstaltung}}'}</code>{' '}
              für dynamische Inhalte.
            </p>
          </div>
        )}

        {activeTab === 'html' && (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="bodyHtml"
                className="mb-1 block text-sm font-medium text-neutral-700"
              >
                HTML-Inhalt
              </label>
              <textarea
                id="bodyHtml"
                value={bodyHtml}
                onChange={(e) => setBodyHtml(e.target.value)}
                rows={20}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 font-mono text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                placeholder="<div>HTML-Inhalt...</div>"
              />
            </div>
            <p className="text-sm text-neutral-500">
              Der HTML-Inhalt wird in E-Mail-Clients angezeigt, die HTML unterstützen.
              Verwende inline CSS für Styling.
            </p>
          </div>
        )}

        {activeTab === 'text' && (
          <div className="space-y-4">
            <div>
              <label
                htmlFor="bodyText"
                className="mb-1 block text-sm font-medium text-neutral-700"
              >
                Text-Inhalt (Fallback)
              </label>
              <textarea
                id="bodyText"
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                rows={20}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 font-mono text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                placeholder="Reiner Text-Inhalt..."
              />
            </div>
            <p className="text-sm text-neutral-500">
              Der Text-Inhalt wird angezeigt, wenn HTML nicht unterstützt wird.
              Dies ist auch für Barrierefreiheit wichtig.
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-neutral-200 pt-4">
        <Button variant="ghost" onClick={handleReset} disabled={isPending}>
          Standard wiederherstellen
        </Button>

        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={handlePreview} disabled={isPending}>
            Vorschau
          </Button>
          <Button onClick={handleSave} disabled={isPending || !hasChanges}>
            {isPending ? 'Speichern...' : 'Speichern'}
          </Button>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && previewData && (
        <TemplatePreview
          subject={previewData.subject}
          html={previewData.html}
          text={previewData.text}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  )
}
