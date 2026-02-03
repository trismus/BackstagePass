'use server'

import { createClient } from '../supabase/server'
import { getUserProfile } from '../supabase/server'
import { feedbackSchema, KATEGORIE_GITHUB_LABELS } from '../validations/feedback'
import type { FeedbackKategorie } from '../validations/feedback'

const GITHUB_REPO =
  process.env.GITHUB_REPO ?? 'trismus/BackstagePass'
const GITHUB_TOKEN = process.env.GITHUB_TOKEN

type FeedbackResult = {
  success: boolean
  error?: string
  issueUrl?: string
}

export async function submitFeedback(formData: FormData): Promise<FeedbackResult> {
  // 1. Authentifizierung prüfen
  const profile = await getUserProfile()
  if (!profile) {
    return { success: false, error: 'Nicht angemeldet' }
  }

  // 2. Felder extrahieren & validieren
  const raw = {
    kategorie: formData.get('kategorie') as string,
    titel: formData.get('titel') as string,
    beschreibung: formData.get('beschreibung') as string,
  }

  const result = feedbackSchema.safeParse(raw)
  if (!result.success) {
    const firstError = result.error.issues[0]?.message ?? 'Ungültige Eingabe'
    return { success: false, error: firstError }
  }

  const { kategorie, titel, beschreibung } = result.data

  // 3. Screenshot-Upload (optional)
  let screenshotUrl: string | null = null
  const screenshot = formData.get('screenshot') as File | null

  if (screenshot && screenshot.size > 0) {
    if (screenshot.size > 5 * 1024 * 1024) {
      return { success: false, error: 'Screenshot darf maximal 5 MB gross sein' }
    }

    if (!screenshot.type.startsWith('image/')) {
      return { success: false, error: 'Nur Bilddateien sind erlaubt' }
    }

    const ext = screenshot.name.split('.').pop() ?? 'png'
    const path = `${profile.id}/${Date.now()}.${ext}`

    const supabase = await createClient()
    const { error: uploadError } = await supabase.storage
      .from('feedback-screenshots')
      .upload(path, screenshot, {
        contentType: screenshot.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Screenshot upload failed:', uploadError)
      return { success: false, error: 'Screenshot-Upload fehlgeschlagen' }
    }

    const { data: urlData } = supabase.storage
      .from('feedback-screenshots')
      .getPublicUrl(path)

    screenshotUrl = urlData.publicUrl
  }

  // 4. GitHub Issue Body zusammenbauen
  const kategorieLabel =
    kategorie === 'bug'
      ? 'Bug-Meldung'
      : kategorie === 'feature'
        ? 'Feature-Wunsch'
        : 'Sonstiges Feedback'

  let body = `## ${kategorieLabel}\n\n${beschreibung}\n\n`
  body += `### Benutzer-Info\n`
  body += `- **Name:** ${profile.display_name ?? 'Unbekannt'}\n`
  body += `- **Rolle:** ${profile.role}\n`
  body += `- **Zeitpunkt:** ${new Date().toLocaleString('de-CH')}\n`

  if (screenshotUrl) {
    body += `\n### Screenshot\n![Screenshot](${screenshotUrl})\n`
  }

  body += `\n---\n*Automatisch via In-App Feedback erstellt*`

  // 5. GitHub Issue erstellen
  if (!GITHUB_TOKEN) {
    console.error('GITHUB_TOKEN is not configured')
    return { success: false, error: 'Feedback-System ist nicht konfiguriert' }
  }

  const githubLabel = KATEGORIE_GITHUB_LABELS[kategorie as FeedbackKategorie]

  try {
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/issues`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `[Feedback] ${titel}`,
          body,
          labels: ['user-feedback', githubLabel],
        }),
      }
    )

    if (!response.ok) {
      const errorBody = await response.text()
      console.error('GitHub API error:', response.status, errorBody)
      return { success: false, error: 'GitHub Issue konnte nicht erstellt werden' }
    }

    const issue = await response.json()
    return { success: true, issueUrl: issue.html_url }
  } catch (err) {
    console.error('GitHub API request failed:', err)
    return { success: false, error: 'Verbindung zu GitHub fehlgeschlagen' }
  }
}
