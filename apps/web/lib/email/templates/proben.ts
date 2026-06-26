/**
 * Email Templates — Proben (Sprint 5 / Issue #489)
 *
 * Inline TS templates (HTML + plain text) for immediate invitation / change /
 * cancellation mails when a Probe-Teilnehmer is added or the Probe itself is
 * updated. Mirrors the convention used in `helferliste.ts`: no DB round-trip,
 * German UI text.
 */

const baseStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  .header { background: #1a1a2e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
  .header h1 { margin: 0; font-size: 24px; }
  .content { background: #f9f9f9; padding: 20px; border: 1px solid #e0e0e0; }
  .footer { background: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
  .info-box { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #3b82f6; }
  .diff-box { background: #fffbeb; padding: 12px 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #f59e0b; }
  .diff-row { padding: 4px 0; }
  .diff-old { color: #9ca3af; text-decoration: line-through; }
  .diff-new { color: #047857; font-weight: 600; }
  .cancel-box { background: #fef2f2; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #dc2626; }
`

const footerHtml = `
  <div class="footer">
    <p>Diese E-Mail wurde automatisch von BackstagePass gesendet.</p>
    <p>Theatergruppe Widen</p>
    <p style="font-style: italic; color: #9ca3af; font-size: 11px; margin: 2px 0 0 0;">s'Theater uf em Mutschelle</p>
  </div>
`

const footerText = `
--
BackstagePass - Theatergruppe Widen
s'Theater uf em Mutschelle
`

// =============================================================================
// Helpers — German date / time formatting
// =============================================================================

function formatGermanDate(isoDate: string): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  if (!y || !m || !d) return isoDate
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.toLocaleDateString('de-CH', {
    weekday: 'short',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

function formatGermanTime(time: string | null | undefined): string {
  if (!time) return ''
  const parts = time.split(':')
  if (parts.length < 2) return time
  return `${parts[0]}:${parts[1]}`
}

function formatTimeRange(start: string | null | undefined, end: string | null | undefined): string {
  const s = formatGermanTime(start)
  const e = formatGermanTime(end)
  if (s && e) return `${s} – ${e} Uhr`
  if (s) return `${s} Uhr`
  if (e) return `bis ${e} Uhr`
  return ''
}

// =============================================================================
// Probe Einladung (Sofort-Mail beim Hinzufügen)
// =============================================================================

export interface ProbeEinladungData {
  vorname: string
  probeTitel: string
  stueckTitel?: string
  datum: string
  startzeit?: string | null
  endzeit?: string | null
  ort?: string | null
  beschreibung?: string | null
  probeLink: string
}

export function probeEinladungEmail(
  data: ProbeEinladungData
): { subject: string; html: string; text: string } {
  const datum = formatGermanDate(data.datum)
  const zeitRange = formatTimeRange(data.startzeit, data.endzeit)
  const titel = data.stueckTitel ? `${data.stueckTitel} — ${data.probeTitel}` : data.probeTitel

  const subject = `Probeneinladung: ${titel} am ${datum}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head><style>${baseStyles}</style></head>
    <body>
      <div class="container">
        <div class="header"><h1>BackstagePass</h1></div>
        <div class="content">
          <p>Hallo ${data.vorname},</p>
          <p>du wurdest zu einer Probe eingeladen:</p>
          <div class="info-box">
            <h3 style="margin-top: 0;">${titel}</h3>
            <p><strong>Datum:</strong> ${datum}</p>
            ${zeitRange ? `<p><strong>Zeit:</strong> ${zeitRange}</p>` : ''}
            ${data.ort ? `<p><strong>Ort:</strong> ${data.ort}</p>` : ''}
            ${data.beschreibung ? `<p style="margin-top: 12px; color: #555;">${data.beschreibung}</p>` : ''}
          </div>
          <p>Bitte gib in BackstagePass Bescheid, ob du teilnehmen kannst:</p>
          <p style="text-align: center; margin: 20px 0;">
            <a href="${data.probeLink}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Probe ansehen</a>
          </p>
          <p style="font-size: 13px; color: #666;">
            Diese Einladung kannst du in deinen Benachrichtigungs-Einstellungen abschalten.
          </p>
        </div>
        ${footerHtml}
      </div>
    </body>
    </html>
  `

  const text = `
Hallo ${data.vorname},

du wurdest zu einer Probe eingeladen:

${titel}
Datum: ${datum}
${zeitRange ? `Zeit: ${zeitRange}` : ''}
${data.ort ? `Ort: ${data.ort}` : ''}
${data.beschreibung ? `\n${data.beschreibung}\n` : ''}
Bitte gib in BackstagePass Bescheid, ob du teilnehmen kannst:
${data.probeLink}

${footerText}
  `.trim()

  return { subject, html, text }
}

// =============================================================================
// Probe Änderung
// =============================================================================

export interface ProbeAenderungChange {
  field: 'datum' | 'startzeit' | 'endzeit' | 'ort'
  vorher: string
  nachher: string
}

export interface ProbeAenderungData {
  vorname: string
  probeTitel: string
  stueckTitel?: string
  datum: string
  startzeit?: string | null
  endzeit?: string | null
  ort?: string | null
  changes: ProbeAenderungChange[]
  probeLink: string
}

const FIELD_LABELS: Record<ProbeAenderungChange['field'], string> = {
  datum: 'Datum',
  startzeit: 'Startzeit',
  endzeit: 'Endzeit',
  ort: 'Ort',
}

export function probeAenderungEmail(
  data: ProbeAenderungData
): { subject: string; html: string; text: string } {
  const datum = formatGermanDate(data.datum)
  const zeitRange = formatTimeRange(data.startzeit, data.endzeit)
  const titel = data.stueckTitel ? `${data.stueckTitel} — ${data.probeTitel}` : data.probeTitel

  const subject = `Probe geändert: ${titel}`

  const diffRowsHtml = data.changes
    .map((c) => {
      const label = FIELD_LABELS[c.field]
      return `
        <div class="diff-row">
          <strong>${label}:</strong>
          <span class="diff-old">${c.vorher || '—'}</span>
          &nbsp;→&nbsp;
          <span class="diff-new">${c.nachher || '—'}</span>
        </div>
      `
    })
    .join('')

  const diffRowsText = data.changes
    .map((c) => `  - ${FIELD_LABELS[c.field]}: ${c.vorher || '—'} → ${c.nachher || '—'}`)
    .join('\n')

  const html = `
    <!DOCTYPE html>
    <html>
    <head><style>${baseStyles}</style></head>
    <body>
      <div class="container">
        <div class="header"><h1>BackstagePass</h1></div>
        <div class="content">
          <p>Hallo ${data.vorname},</p>
          <p>eine Probe, zu der du eingeladen bist, hat sich geändert:</p>
          <div class="info-box">
            <h3 style="margin-top: 0;">${titel}</h3>
            <p><strong>Datum:</strong> ${datum}</p>
            ${zeitRange ? `<p><strong>Zeit:</strong> ${zeitRange}</p>` : ''}
            ${data.ort ? `<p><strong>Ort:</strong> ${data.ort}</p>` : ''}
          </div>
          <div class="diff-box">
            <p style="margin-top: 0; font-weight: 600;">Was hat sich geändert?</p>
            ${diffRowsHtml}
          </div>
          <p>Bitte prüfe die Details und bestätige ggf. neu in BackstagePass:</p>
          <p style="text-align: center; margin: 20px 0;">
            <a href="${data.probeLink}" style="display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Probe ansehen</a>
          </p>
        </div>
        ${footerHtml}
      </div>
    </body>
    </html>
  `

  const text = `
Hallo ${data.vorname},

eine Probe, zu der du eingeladen bist, hat sich geändert:

${titel}
Datum: ${datum}
${zeitRange ? `Zeit: ${zeitRange}` : ''}
${data.ort ? `Ort: ${data.ort}` : ''}

Was hat sich geändert?
${diffRowsText}

Bitte prüfe die Details:
${data.probeLink}

${footerText}
  `.trim()

  return { subject, html, text }
}

// =============================================================================
// Probe Absage
// =============================================================================

export interface ProbeAbsageData {
  vorname: string
  probeTitel: string
  stueckTitel?: string
  datum: string
  grund?: string | null
}

export function probeAbsageEmail(
  data: ProbeAbsageData
): { subject: string; html: string; text: string } {
  const datum = formatGermanDate(data.datum)
  const titel = data.stueckTitel ? `${data.stueckTitel} — ${data.probeTitel}` : data.probeTitel

  const subject = `Probe abgesagt: ${titel} am ${datum}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head><style>${baseStyles}</style></head>
    <body>
      <div class="container">
        <div class="header"><h1>BackstagePass</h1></div>
        <div class="content">
          <p>Hallo ${data.vorname},</p>
          <div class="cancel-box">
            <p style="margin: 0;"><strong>Die folgende Probe wurde abgesagt:</strong></p>
            <h3 style="margin: 10px 0 0 0;">${titel}</h3>
            <p style="margin: 4px 0 0 0;"><strong>Datum:</strong> ${datum}</p>
          </div>
          ${
            data.grund
              ? `<p><strong>Grund:</strong><br>${data.grund}</p>`
              : '<p>Es wurde kein Grund angegeben.</p>'
          }
          <p>Wir melden uns mit einem neuen Termin, sobald er steht.</p>
        </div>
        ${footerHtml}
      </div>
    </body>
    </html>
  `

  const text = `
Hallo ${data.vorname},

Die folgende Probe wurde abgesagt:
${titel}
Datum: ${datum}

${data.grund ? `Grund: ${data.grund}` : 'Es wurde kein Grund angegeben.'}

Wir melden uns mit einem neuen Termin, sobald er steht.

${footerText}
  `.trim()

  return { subject, html, text }
}
