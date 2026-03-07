/**
 * Email Templates for Helferliste
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
`

interface EventInfo {
  name: string
  datum: string
  ort?: string
  rolle?: string
  zeitblock?: string
}

/**
 * Email: New HelferEvent published
 */
export function eventPublishedEmail(
  recipientName: string,
  event: EventInfo,
  publicLink?: string
): { subject: string; html: string; text: string } {
  const subject = `Neues Helferevent: ${event.name}`

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
          <p>Ein neues Helferevent wurde veröffentlicht und sucht Unterstützung:</p>

          <div class="info-box">
            <h3 style="margin-top: 0;">${event.name}</h3>
            <p><strong>Datum:</strong> ${event.datum}</p>
            ${event.ort ? `<p><strong>Ort:</strong> ${event.ort}</p>` : ''}
          </div>

          <p>Schau dir die offenen Rollen an und melde dich an:</p>
          <p>
            <a href="${publicLink || '#'}" class="button">Zum Event</a>
          </p>
        </div>
        <div class="footer">
          <p>Diese E-Mail wurde automatisch von BackstagePass gesendet.</p>
          <p>Theatergruppe Widen</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
Hallo ${recipientName},

Ein neues Helferevent wurde veröffentlicht: ${event.name}

Datum: ${event.datum}
${event.ort ? `Ort: ${event.ort}` : ''}

Schau dir die offenen Rollen an: ${publicLink || 'Siehe BackstagePass'}

--
BackstagePass - Theatergruppe Widen
  `

  return { subject, html, text }
}

/**
 * Email: Registration confirmation
 */
export function registrationConfirmationEmail(
  recipientName: string,
  event: EventInfo,
  isWaitlist: boolean = false
): { subject: string; html: string; text: string } {
  const statusText = isWaitlist ? 'Warteliste' : 'Anmeldung'
  const subject = `${statusText} bestätigt: ${event.name}`

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
          <p>Deine ${isWaitlist ? 'Anmeldung auf die Warteliste' : 'Anmeldung'} wurde erfolgreich registriert:</p>

          <div class="info-box">
            <h3 style="margin-top: 0;">${event.name}</h3>
            <p><strong>Datum:</strong> ${event.datum}</p>
            ${event.ort ? `<p><strong>Ort:</strong> ${event.ort}</p>` : ''}
            ${event.rolle ? `<p><strong>Rolle:</strong> ${event.rolle}</p>` : ''}
            ${event.zeitblock ? `<p><strong>Zeit:</strong> ${event.zeitblock}</p>` : ''}
            <p>
              <span class="status-badge ${isWaitlist ? 'status-warteliste' : 'status-angemeldet'}">
                ${isWaitlist ? 'Warteliste' : 'Angemeldet'}
              </span>
            </p>
          </div>

          ${
            isWaitlist
              ? `<p>Du stehst auf der Warteliste. Wir melden uns, sobald ein Platz frei wird.</p>`
              : `<p>Wir freuen uns auf dich!</p>`
          }
        </div>
        <div class="footer">
          <p>Diese E-Mail wurde automatisch von BackstagePass gesendet.</p>
          <p>Theatergruppe Widen</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
Hallo ${recipientName},

Deine ${isWaitlist ? 'Anmeldung auf die Warteliste' : 'Anmeldung'} wurde erfolgreich registriert:

Event: ${event.name}
Datum: ${event.datum}
${event.ort ? `Ort: ${event.ort}` : ''}
${event.rolle ? `Rolle: ${event.rolle}` : ''}
${event.zeitblock ? `Zeit: ${event.zeitblock}` : ''}
Status: ${isWaitlist ? 'Warteliste' : 'Angemeldet'}

${isWaitlist ? 'Du stehst auf der Warteliste. Wir melden uns, sobald ein Platz frei wird.' : 'Wir freuen uns auf dich!'}

--
BackstagePass - Theatergruppe Widen
  `

  return { subject, html, text }
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
  `

  return { subject, html, text }
}

/**
 * Email: Status update notification
 */
export function statusUpdateEmail(
  recipientName: string,
  event: EventInfo,
  newStatus: 'bestaetigt' | 'abgelehnt' | 'warteliste',
  message?: string
): { subject: string; html: string; text: string } {
  const statusLabels = {
    bestaetigt: 'Bestätigt',
    abgelehnt: 'Abgelehnt',
    warteliste: 'Warteliste',
  }

  const statusMessages = {
    bestaetigt:
      'Deine Anmeldung wurde bestätigt. Wir freuen uns auf deine Unterstützung!',
    abgelehnt:
      'Leider konnte deine Anmeldung nicht berücksichtigt werden. Bei Fragen melde dich gerne bei uns.',
    warteliste:
      'Du stehst jetzt auf der Warteliste. Wir melden uns, sobald ein Platz frei wird.',
  }

  const subject = `Status-Update: ${event.name} - ${statusLabels[newStatus]}`

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
          <p>Der Status deiner Anmeldung wurde aktualisiert:</p>

          <div class="info-box">
            <h3 style="margin-top: 0;">${event.name}</h3>
            <p><strong>Datum:</strong> ${event.datum}</p>
            ${event.rolle ? `<p><strong>Rolle:</strong> ${event.rolle}</p>` : ''}
            <p>
              <span class="status-badge status-${newStatus}">
                ${statusLabels[newStatus]}
              </span>
            </p>
          </div>

          <p>${message || statusMessages[newStatus]}</p>
        </div>
        <div class="footer">
          <p>Diese E-Mail wurde automatisch von BackstagePass gesendet.</p>
          <p>Theatergruppe Widen</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
Hallo ${recipientName},

Der Status deiner Anmeldung wurde aktualisiert:

Event: ${event.name}
Datum: ${event.datum}
${event.rolle ? `Rolle: ${event.rolle}` : ''}
Neuer Status: ${statusLabels[newStatus]}

${message || statusMessages[newStatus]}

--
BackstagePass - Theatergruppe Widen
  `

  return { subject, html, text }
}

/**
 * Email: Cancellation confirmation
 * Sent to the helper after they cancel their registration.
 */
export function cancellationConfirmationEmail(
  recipientName: string,
  event: EventInfo
): { subject: string; html: string; text: string } {
  const subject = `Abmeldung bestätigt: ${event.name}`

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
          <p>Deine Anmeldung wurde erfolgreich storniert:</p>

          <div class="info-box">
            <h3 style="margin-top: 0;">${event.name}</h3>
            <p><strong>Datum:</strong> ${event.datum}</p>
            ${event.ort ? `<p><strong>Ort:</strong> ${event.ort}</p>` : ''}
            ${event.rolle ? `<p><strong>Rolle:</strong> ${event.rolle}</p>` : ''}
            ${event.zeitblock ? `<p><strong>Zeit:</strong> ${event.zeitblock}</p>` : ''}
          </div>

          <p>Danke, dass du uns rechtzeitig Bescheid gegeben hast. So können wir den Platz an jemand anderen vergeben.</p>
        </div>
        <div class="footer">
          <p>Diese E-Mail wurde automatisch von BackstagePass gesendet.</p>
          <p>Theatergruppe Widen</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
Hallo ${recipientName},

Deine Anmeldung wurde erfolgreich storniert:

Event: ${event.name}
Datum: ${event.datum}
${event.ort ? `Ort: ${event.ort}` : ''}
${event.rolle ? `Rolle: ${event.rolle}` : ''}
${event.zeitblock ? `Zeit: ${event.zeitblock}` : ''}

Danke, dass du uns rechtzeitig Bescheid gegeben hast.

--
BackstagePass - Theatergruppe Widen
  `

  return { subject, html, text }
}

/**
 * Email: Waitlist promotion notification
 * Sent when a helper is auto-promoted from warteliste to angemeldet.
 */
export function waitlistPromotionEmail(
  recipientName: string,
  event: EventInfo,
  abmeldungLink?: string
): { subject: string; html: string; text: string } {
  const subject = `Platz frei geworden: ${event.name}`

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
          <p>Es ist ein Platz frei geworden! Deine Anmeldung wurde von der Warteliste bestätigt:</p>

          <div class="info-box">
            <h3 style="margin-top: 0;">${event.name}</h3>
            <p><strong>Datum:</strong> ${event.datum}</p>
            ${event.ort ? `<p><strong>Ort:</strong> ${event.ort}</p>` : ''}
            ${event.rolle ? `<p><strong>Rolle:</strong> ${event.rolle}</p>` : ''}
            ${event.zeitblock ? `<p><strong>Zeit:</strong> ${event.zeitblock}</p>` : ''}
            <p>
              <span class="status-badge status-angemeldet">
                Angemeldet
              </span>
            </p>
          </div>

          <p>Wir freuen uns auf dich!</p>

          ${abmeldungLink ? `
          <p style="font-size: 13px; color: #666;">
            Falls du doch nicht teilnehmen kannst, kannst du dich hier abmelden:
            <a href="${abmeldungLink}" style="color: #dc2626;">Anmeldung stornieren</a>
          </p>
          ` : ''}
        </div>
        <div class="footer">
          <p>Diese E-Mail wurde automatisch von BackstagePass gesendet.</p>
          <p>Theatergruppe Widen</p>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
Hallo ${recipientName},

Es ist ein Platz frei geworden! Deine Anmeldung wurde von der Warteliste bestätigt:

Event: ${event.name}
Datum: ${event.datum}
${event.ort ? `Ort: ${event.ort}` : ''}
${event.rolle ? `Rolle: ${event.rolle}` : ''}
${event.zeitblock ? `Zeit: ${event.zeitblock}` : ''}
Status: Angemeldet

Wir freuen uns auf dich!
${abmeldungLink ? `\nFalls du doch nicht teilnehmen kannst: ${abmeldungLink}` : ''}

--
BackstagePass - Theatergruppe Widen
  `

  return { subject, html, text }
}
