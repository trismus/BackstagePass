/**
 * Email Templates — Helfer (System B)
 *
 * Only the templates still in active use remain. The dead System-A templates
 * (eventPublishedEmail, registrationConfirmationEmail, statusUpdateEmail,
 *  cancellationConfirmationEmail, waitlistPromotionEmail) were removed in
 * Issue #475 alongside the database drop of System A.
 */

const baseStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  .header { background: #1a1a2e; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
  .header h1 { margin: 0; font-size: 24px; }
  .content { background: #f9f9f9; padding: 20px; border: 1px solid #e0e0e0; }
  .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
  .button:hover { background: #2563eb; }
  .footer { background: #f0f0f0; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
  .info-box { background: white; padding: 15px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #3b82f6; }
  .status-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 14px; font-weight: 500; }
  .status-angemeldet { background: #dbeafe; color: #1d4ed8; }
  .status-bestaetigt { background: #d1fae5; color: #047857; }
  .status-abgelehnt { background: #fee2e2; color: #dc2626; }
  .status-warteliste { background: #fef3c7; color: #d97706; }
  .status-zugesagt { background: #d1fae5; color: #047857; }
  .status-vorgeschlagen { background: #fef3c7; color: #d97706; }
`

interface EventInfo {
  name: string
  datum: string
  ort?: string
  rolle?: string
  zeitblock?: string
}

/**
 * Email: Multi-shift registration confirmation (US-8)
 * Batched email with all shifts, cancellation links, dashboard link, coordinator info.
 */

export interface ShiftInfo {
  rolle: string
  zeitblock: string
  status: 'angemeldet' | 'warteliste'
  abmeldungLink: string
}

export function multiRegistrationConfirmationEmail(
  recipientName: string,
  event: EventInfo,
  shifts: ShiftInfo[],
  dashboardLink: string,
  koordinator?: { name: string; email: string; telefon?: string }
): { subject: string; html: string; text: string } {
  const hasWaitlist = shifts.some((s) => s.status === 'warteliste')
  const hasConfirmed = shifts.some((s) => s.status === 'angemeldet')
  const subject = hasWaitlist && hasConfirmed
    ? `Anmeldung & Warteliste: ${event.name}`
    : hasWaitlist
      ? `Warteliste: ${event.name}`
      : `Anmeldebestätigung: ${event.name}`

  const shiftRowsHtml = shifts
    .map(
      (s) => `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${s.rolle}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${s.zeitblock || '–'}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">
            <span class="status-badge ${s.status === 'warteliste' ? 'status-warteliste' : 'status-angemeldet'}">
              ${s.status === 'warteliste' ? 'Warteliste' : 'Angemeldet'}
            </span>
          </td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">
            ${s.abmeldungLink ? `<a href="${s.abmeldungLink}" style="color: #dc2626; font-size: 13px;">Stornieren</a>` : ''}
          </td>
        </tr>`
    )
    .join('')

  const koordinatorHtml = koordinator
    ? `
      <div style="margin-top: 15px; padding: 12px; background: #f8fafc; border-radius: 6px;">
        <p style="margin: 0 0 4px; font-weight: 500; font-size: 14px;">Koordination</p>
        <p style="margin: 0; font-size: 13px; color: #555;">
          ${koordinator.name} &middot;
          <a href="mailto:${koordinator.email}" style="color: #3b82f6;">${koordinator.email}</a>
          ${koordinator.telefon ? ` &middot; ${koordinator.telefon}` : ''}
        </p>
      </div>`
    : ''

  const html = `
    <!DOCTYPE html>
    <html>
    <head><style>${baseStyles}</style></head>
    <body>
      <div class="container">
        <div class="header">
          <h1>BackstagePass</h1>
        </div>
        <div class="content">
          <p>Hallo ${recipientName},</p>
          <p>Deine Anmeldungen wurden erfolgreich registriert:</p>

          <div class="info-box">
            <h3 style="margin-top: 0;">${event.name}</h3>
            <p><strong>Datum:</strong> ${event.datum}</p>
            ${event.ort ? `<p><strong>Ort:</strong> ${event.ort}</p>` : ''}
          </div>

          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <thead>
              <tr style="background: #f1f5f9;">
                <th style="padding: 8px 12px; text-align: left; font-size: 13px; color: #64748b;">Rolle</th>
                <th style="padding: 8px 12px; text-align: left; font-size: 13px; color: #64748b;">Zeit</th>
                <th style="padding: 8px 12px; text-align: left; font-size: 13px; color: #64748b;">Status</th>
                <th style="padding: 8px 12px; text-align: left; font-size: 13px; color: #64748b;"></th>
              </tr>
            </thead>
            <tbody>
              ${shiftRowsHtml}
            </tbody>
          </table>

          ${
            hasWaitlist
              ? `<p style="color: #d97706; font-size: 14px;">
                  Einige deiner Anmeldungen sind auf der Warteliste. Wir melden uns, sobald ein Platz frei wird.
                </p>`
              : `<p>Wir freuen uns auf dich!</p>`
          }

          ${hasConfirmed ? '<p style="font-size: 13px; color: #666;">Im Anhang findest du eine Kalenderdatei (.ics) für deine bestätigten Einsätze.</p>' : ''}

          <p style="text-align: center; margin: 20px 0;">
            <a href="${dashboardLink}" class="button">Meine Einsätze ansehen</a>
          </p>

          ${koordinatorHtml}
        </div>
        <div class="footer">
          <p>Diese E-Mail wurde automatisch von BackstagePass gesendet.</p>
          <p>Theatergruppe Widen</p>
          <p style="font-style: italic; color: #9ca3af; font-size: 11px; margin: 2px 0 0 0;">s'Theater uf em Mutschelle</p>
        </div>
      </div>
    </body>
    </html>
  `

  const shiftRowsText = shifts
    .map(
      (s) =>
        `  - ${s.rolle}${s.zeitblock ? ` (${s.zeitblock})` : ''} — ${s.status === 'warteliste' ? 'Warteliste' : 'Angemeldet'}${s.abmeldungLink ? `\n    Stornieren: ${s.abmeldungLink}` : ''}`
    )
    .join('\n')

  const text = `
Hallo ${recipientName},

Deine Anmeldungen wurden erfolgreich registriert:

Event: ${event.name}
Datum: ${event.datum}
${event.ort ? `Ort: ${event.ort}` : ''}

Deine Rollen:
${shiftRowsText}

${hasWaitlist ? 'Einige deiner Anmeldungen sind auf der Warteliste. Wir melden uns, sobald ein Platz frei wird.' : 'Wir freuen uns auf dich!'}

Meine Einsätze: ${dashboardLink}
${koordinator ? `\nKoordination: ${koordinator.name}, ${koordinator.email}${koordinator.telefon ? `, ${koordinator.telefon}` : ''}` : ''}

--
BackstagePass - Theatergruppe Widen
s'Theater uf em Mutschelle
  `

  return { subject, html, text }
}

// =============================================================================
// Schicht-Erinnerung (Bulk reminder for all helpers)
// =============================================================================

export interface ErinnerungSchicht {
  veranstaltung: string
  datum: string
  rolle: string
  zeitblock?: string
  status: string
}

/**
 * Email: Shift reminder
 * Sent to all helpers as a reminder of their upcoming assignments.
 */
export function schichterinnerungEmail(
  recipientName: string,
  schichten: ErinnerungSchicht[],
  dashboardLink?: string
): { subject: string; html: string; text: string } {
  const subject = `Erinnerung: Deine Schichten bei der Theatergruppe Widen`

  const statusLabels: Record<string, string> = {
    zugesagt: 'Zugesagt',
    bestaetigt: 'Bestätigt',
    angemeldet: 'Angemeldet',
    vorgeschlagen: 'Vorgeschlagen',
    warteliste: 'Warteliste',
  }

  const schichtRowsHtml = schichten
    .map(
      (s) => `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${s.datum}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${s.veranstaltung}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${s.rolle}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">${s.zeitblock || '–'}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e7eb;">
            <span class="status-badge status-${s.status}">
              ${statusLabels[s.status] ?? s.status}
            </span>
          </td>
        </tr>`
    )
    .join('')

  const html = `
    <!DOCTYPE html>
    <html>
    <head><style>${baseStyles}</style></head>
    <body>
      <div class="container">
        <div class="header">
          <h1>BackstagePass</h1>
        </div>
        <div class="content">
          <p>Hallo ${recipientName},</p>
          <p>Hier ist eine Übersicht deiner eingetragenen Schichten bei der Theatergruppe Widen:</p>

          <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
            <thead>
              <tr style="background: #f1f5f9;">
                <th style="padding: 8px 12px; text-align: left; font-size: 13px; color: #64748b;">Datum</th>
                <th style="padding: 8px 12px; text-align: left; font-size: 13px; color: #64748b;">Veranstaltung</th>
                <th style="padding: 8px 12px; text-align: left; font-size: 13px; color: #64748b;">Rolle</th>
                <th style="padding: 8px 12px; text-align: left; font-size: 13px; color: #64748b;">Zeit</th>
                <th style="padding: 8px 12px; text-align: left; font-size: 13px; color: #64748b;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${schichtRowsHtml}
            </tbody>
          </table>

          <p>Wir freuen uns auf dich und danken dir herzlich für deine Unterstützung!</p>
          <p>Bei Fragen oder falls du nicht dabei sein kannst, melde dich bitte möglichst früh bei uns.</p>

          ${
            dashboardLink
              ? `<p style="text-align: center; margin: 20px 0;">
                  <a href="${dashboardLink}" class="button">Meine Einsätze ansehen</a>
                </p>`
              : ''
          }
        </div>
        <div class="footer">
          <p>Diese E-Mail wurde automatisch von BackstagePass gesendet.</p>
          <p>Theatergruppe Widen</p>
          <p style="font-style: italic; color: #9ca3af; font-size: 11px; margin: 2px 0 0 0;">s'Theater uf em Mutschelle</p>
        </div>
      </div>
    </body>
    </html>
  `

  const schichtRowsText = schichten
    .map(
      (s) =>
        `  - ${s.datum} | ${s.veranstaltung} | ${s.rolle}${s.zeitblock ? ` (${s.zeitblock})` : ''} — ${statusLabels[s.status] ?? s.status}`
    )
    .join('\n')

  const text = `
Hallo ${recipientName},

Hier ist eine Übersicht deiner eingetragenen Schichten bei der Theatergruppe Widen:

${schichtRowsText}

Wir freuen uns auf dich und danken dir herzlich für deine Unterstützung!
Bei Fragen oder falls du nicht dabei sein kannst, melde dich bitte möglichst früh bei uns.
${dashboardLink ? `\nMeine Einsätze: ${dashboardLink}` : ''}

--
BackstagePass - Theatergruppe Widen
s'Theater uf em Mutschelle
  `

  return { subject, html, text }
}
