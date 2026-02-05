'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '../supabase/server'
import { requirePermission } from '../supabase/auth-helpers'
import { renderEmailTemplate, SAMPLE_PLACEHOLDER_DATA } from '../utils/email-renderer'
import type {
  EmailTemplate,
  EmailTemplateTyp,
  EmailTemplateUpdate,
  EmailPlaceholderData,
} from '../supabase/types'

// =============================================================================
// Fetch Actions
// =============================================================================

/**
 * Get all email templates
 */
export async function getAllEmailTemplates(): Promise<EmailTemplate[]> {
  await requirePermission('admin:access')

  const supabase = await createClient()

  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .order('typ')

  if (error) {
    console.error('Error fetching email templates:', error)
    return []
  }

  return (data || []) as EmailTemplate[]
}

/**
 * Get a single email template by type
 */
export async function getEmailTemplate(
  typ: EmailTemplateTyp
): Promise<EmailTemplate | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('typ', typ)
    .single()

  if (error) {
    console.error('Error fetching email template:', error)
    return null
  }

  return data as EmailTemplate
}

/**
 * Get an email template by type (for internal use, no auth check)
 * Used by email sending functions that already have permission checked
 */
export async function getEmailTemplateInternal(
  typ: EmailTemplateTyp
): Promise<EmailTemplate | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('email_templates')
    .select('*')
    .eq('typ', typ)
    .eq('aktiv', true)
    .single()

  if (error) {
    console.error('Error fetching email template:', error)
    return null
  }

  return data as EmailTemplate
}

// =============================================================================
// Update Actions
// =============================================================================

/**
 * Update an email template
 */
export async function updateEmailTemplate(
  typ: EmailTemplateTyp,
  updates: EmailTemplateUpdate
): Promise<{ success: boolean; error?: string }> {
  await requirePermission('admin:access')

  const supabase = await createClient()

  const { error } = await supabase
    .from('email_templates')
    .update(updates as never)
    .eq('typ', typ)

  if (error) {
    console.error('Error updating email template:', error)
    return { success: false, error: 'Fehler beim Speichern des Templates' }
  }

  revalidatePath('/admin/email-templates')

  return { success: true }
}

/**
 * Toggle active status of a template
 */
export async function toggleEmailTemplateActive(
  typ: EmailTemplateTyp
): Promise<{ success: boolean; error?: string }> {
  await requirePermission('admin:access')

  const supabase = await createClient()

  // Get current status
  const { data: template, error: fetchError } = await supabase
    .from('email_templates')
    .select('aktiv')
    .eq('typ', typ)
    .single()

  if (fetchError || !template) {
    return { success: false, error: 'Template nicht gefunden' }
  }

  // Toggle
  const { error } = await supabase
    .from('email_templates')
    .update({ aktiv: !template.aktiv } as never)
    .eq('typ', typ)

  if (error) {
    console.error('Error toggling template status:', error)
    return { success: false, error: 'Fehler beim Ändern des Status' }
  }

  revalidatePath('/admin/email-templates')

  return { success: true }
}

// =============================================================================
// Render Actions
// =============================================================================

/**
 * Render an email template with data
 */
export async function renderTemplate(
  typ: EmailTemplateTyp,
  data: EmailPlaceholderData
): Promise<{ subject: string; html: string; text: string } | null> {
  const template = await getEmailTemplateInternal(typ)

  if (!template) {
    console.error(`Email template not found or inactive: ${typ}`)
    return null
  }

  return renderEmailTemplate(template, data)
}

/**
 * Preview a template with sample data
 */
export async function previewEmailTemplate(
  typ: EmailTemplateTyp
): Promise<{ subject: string; html: string; text: string } | null> {
  await requirePermission('admin:access')

  const template = await getEmailTemplate(typ)

  if (!template) {
    return null
  }

  return renderEmailTemplate(template, SAMPLE_PLACEHOLDER_DATA)
}

/**
 * Preview a template with custom content (for live editing)
 */
export async function previewTemplateContent(
  subject: string,
  bodyHtml: string,
  bodyText: string,
  customData?: Partial<EmailPlaceholderData>
): Promise<{ subject: string; html: string; text: string }> {
  await requirePermission('admin:access')

  const data = {
    ...SAMPLE_PLACEHOLDER_DATA,
    ...customData,
  }

  return renderEmailTemplate(
    { subject, body_html: bodyHtml, body_text: bodyText },
    data
  )
}

// =============================================================================
// Reset Actions
// =============================================================================

/**
 * Reset a template to its default content
 * This re-runs the seed data for that specific template
 */
export async function resetEmailTemplateToDefault(
  typ: EmailTemplateTyp
): Promise<{ success: boolean; error?: string }> {
  await requirePermission('admin:access')

  // Default templates content (same as migration)
  const defaults: Record<
    EmailTemplateTyp,
    { subject: string; body_html: string; body_text: string; placeholders: string[] }
  > = {
    confirmation: {
      subject: 'Bestätigung: Helfereinsatz bei {{veranstaltung}}',
      body_html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #7c3aed;">Vielen Dank für deine Anmeldung!</h1>
  <p>Hallo {{vorname}},</p>
  <p>vielen Dank für deine Anmeldung als <strong>{{rolle}}</strong> bei <strong>{{veranstaltung}}</strong>.</p>

  <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h2 style="margin-top: 0; color: #374151;">Deine Einsatzdetails</h2>
    <p><strong>Veranstaltung:</strong> {{veranstaltung}}</p>
    <p><strong>Datum:</strong> {{datum}}</p>
    <p><strong>Rolle:</strong> {{rolle}}</p>
    <p><strong>Zeitblock:</strong> {{zeitblock}}</p>
    <p><strong>Zeit:</strong> {{startzeit}} - {{endzeit}}</p>
    <p><strong>Ort:</strong> {{ort}}</p>
    <p><strong>Treffpunkt:</strong> {{treffpunkt}}</p>
  </div>

  <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 0;"><strong>Briefing:</strong> {{briefing_zeit}}</p>
    <p style="margin: 10px 0 0 0;"><strong>Helferessen:</strong> {{helferessen_zeit}}</p>
  </div>

  <p>Falls du doch nicht kommen kannst, melde dich bitte rechtzeitig ab:</p>
  <p><a href="{{absage_link}}" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Anmeldung stornieren</a></p>

  <p style="margin-top: 30px;">Bei Fragen wende dich an:</p>
  <p>{{koordinator_name}}<br>
  {{koordinator_email}}<br>
  {{koordinator_telefon}}</p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
  <p style="color: #6b7280; font-size: 14px;">Diese E-Mail wurde automatisch von BackstagePass gesendet.</p>
</div>`,
      body_text: `Vielen Dank für deine Anmeldung!

Hallo {{vorname}},

vielen Dank für deine Anmeldung als {{rolle}} bei {{veranstaltung}}.

DEINE EINSATZDETAILS
====================
Veranstaltung: {{veranstaltung}}
Datum: {{datum}}
Rolle: {{rolle}}
Zeitblock: {{zeitblock}}
Zeit: {{startzeit}} - {{endzeit}}
Ort: {{ort}}
Treffpunkt: {{treffpunkt}}

WICHTIGE ZEITEN
===============
Briefing: {{briefing_zeit}}
Helferessen: {{helferessen_zeit}}

Falls du doch nicht kommen kannst, melde dich bitte rechtzeitig ab:
{{absage_link}}

Bei Fragen wende dich an:
{{koordinator_name}}
{{koordinator_email}}
{{koordinator_telefon}}

---
Diese E-Mail wurde automatisch von BackstagePass gesendet.`,
      placeholders: [
        'vorname',
        'nachname',
        'veranstaltung',
        'datum',
        'rolle',
        'zeitblock',
        'startzeit',
        'endzeit',
        'ort',
        'treffpunkt',
        'briefing_zeit',
        'helferessen_zeit',
        'absage_link',
        'koordinator_name',
        'koordinator_email',
        'koordinator_telefon',
      ],
    },
    reminder_48h: {
      subject: 'Erinnerung: Helfereinsatz morgen bei {{veranstaltung}}',
      body_html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #7c3aed;">Nicht vergessen: Morgen ist es soweit!</h1>
  <p>Hallo {{vorname}},</p>
  <p>dein Helfereinsatz bei <strong>{{veranstaltung}}</strong> findet morgen statt.</p>

  <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h2 style="margin-top: 0; color: #374151;">Deine Einsatzdetails</h2>
    <p><strong>Datum:</strong> {{datum}}</p>
    <p><strong>Rolle:</strong> {{rolle}}</p>
    <p><strong>Zeit:</strong> {{startzeit}} - {{endzeit}}</p>
    <p><strong>Ort:</strong> {{ort}}</p>
    <p><strong>Treffpunkt:</strong> {{treffpunkt}}</p>
  </div>

  <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 0;"><strong>Briefing:</strong> {{briefing_zeit}} - Bitte sei pünktlich!</p>
  </div>

  <p>Wir freuen uns auf dich!</p>

  <p style="margin-top: 30px;">Bei Fragen oder wenn du doch absagen musst:</p>
  <p>{{koordinator_name}}<br>
  {{koordinator_email}}<br>
  {{koordinator_telefon}}</p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
  <p style="color: #6b7280; font-size: 14px;">Diese E-Mail wurde automatisch von BackstagePass gesendet.</p>
</div>`,
      body_text: `Nicht vergessen: Morgen ist es soweit!

Hallo {{vorname}},

dein Helfereinsatz bei {{veranstaltung}} findet morgen statt.

DEINE EINSATZDETAILS
====================
Datum: {{datum}}
Rolle: {{rolle}}
Zeit: {{startzeit}} - {{endzeit}}
Ort: {{ort}}
Treffpunkt: {{treffpunkt}}

Briefing: {{briefing_zeit}} - Bitte sei pünktlich!

Wir freuen uns auf dich!

Bei Fragen oder wenn du doch absagen musst:
{{koordinator_name}}
{{koordinator_email}}
{{koordinator_telefon}}

---
Diese E-Mail wurde automatisch von BackstagePass gesendet.`,
      placeholders: [
        'vorname',
        'nachname',
        'veranstaltung',
        'datum',
        'rolle',
        'startzeit',
        'endzeit',
        'ort',
        'treffpunkt',
        'briefing_zeit',
        'koordinator_name',
        'koordinator_email',
        'koordinator_telefon',
      ],
    },
    reminder_6h: {
      subject: 'Heute: Helfereinsatz bei {{veranstaltung}}',
      body_html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #7c3aed;">Heute ist es soweit!</h1>
  <p>Hallo {{vorname}},</p>
  <p>in wenigen Stunden beginnt dein Einsatz bei <strong>{{veranstaltung}}</strong>.</p>

  <div style="background: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
    <p style="margin: 0; font-size: 24px; font-weight: bold;">{{startzeit}} Uhr</p>
    <p style="margin: 5px 0 0 0;">Treffpunkt: {{treffpunkt}}</p>
  </div>

  <p><strong>Rolle:</strong> {{rolle}}</p>
  <p><strong>Ort:</strong> {{ort}}</p>

  <p>Bis gleich!</p>

  <p style="margin-top: 20px;"><strong>Notfall-Kontakt:</strong><br>
  {{koordinator_telefon}}</p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
  <p style="color: #6b7280; font-size: 14px;">Diese E-Mail wurde automatisch von BackstagePass gesendet.</p>
</div>`,
      body_text: `Heute ist es soweit!

Hallo {{vorname}},

in wenigen Stunden beginnt dein Einsatz bei {{veranstaltung}}.

STARTZEIT: {{startzeit}} Uhr
Treffpunkt: {{treffpunkt}}

Rolle: {{rolle}}
Ort: {{ort}}

Bis gleich!

Notfall-Kontakt: {{koordinator_telefon}}

---
Diese E-Mail wurde automatisch von BackstagePass gesendet.`,
      placeholders: [
        'vorname',
        'nachname',
        'veranstaltung',
        'startzeit',
        'treffpunkt',
        'rolle',
        'ort',
        'koordinator_telefon',
      ],
    },
    cancellation: {
      subject: 'Abmeldung bestätigt: {{veranstaltung}}',
      body_html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #374151;">Deine Abmeldung wurde bestätigt</h1>
  <p>Hallo {{vorname}},</p>
  <p>deine Abmeldung von <strong>{{veranstaltung}}</strong> wurde erfolgreich verarbeitet.</p>

  <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <p><strong>Veranstaltung:</strong> {{veranstaltung}}</p>
    <p><strong>Datum:</strong> {{datum}}</p>
    <p><strong>Rolle:</strong> {{rolle}}</p>
  </div>

  <p>Schade, dass du nicht dabei sein kannst. Wir hoffen, dich beim nächsten Mal zu sehen!</p>

  <p>Du kannst dich jederzeit wieder für andere Schichten anmelden:</p>
  <p><a href="{{public_link}}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Zur Anmeldung</a></p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
  <p style="color: #6b7280; font-size: 14px;">Diese E-Mail wurde automatisch von BackstagePass gesendet.</p>
</div>`,
      body_text: `Deine Abmeldung wurde bestätigt

Hallo {{vorname}},

deine Abmeldung von {{veranstaltung}} wurde erfolgreich verarbeitet.

Veranstaltung: {{veranstaltung}}
Datum: {{datum}}
Rolle: {{rolle}}

Schade, dass du nicht dabei sein kannst. Wir hoffen, dich beim nächsten Mal zu sehen!

Du kannst dich jederzeit wieder für andere Schichten anmelden:
{{public_link}}

---
Diese E-Mail wurde automatisch von BackstagePass gesendet.`,
      placeholders: [
        'vorname',
        'nachname',
        'veranstaltung',
        'datum',
        'rolle',
        'public_link',
      ],
    },
    waitlist_assigned: {
      subject: 'Ein Platz ist frei: {{rolle}} bei {{veranstaltung}}',
      body_html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #16a34a;">Gute Nachricht!</h1>
  <p>Hallo {{vorname}},</p>
  <p>ein Platz für <strong>{{rolle}}</strong> bei <strong>{{veranstaltung}}</strong> ist frei geworden!</p>

  <div style="background: #dcfce7; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <p><strong>Veranstaltung:</strong> {{veranstaltung}}</p>
    <p><strong>Datum:</strong> {{datum}}</p>
    <p><strong>Rolle:</strong> {{rolle}}</p>
    <p><strong>Zeit:</strong> {{startzeit}} - {{endzeit}}</p>
  </div>

  <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 0;"><strong>Wichtig:</strong> Bitte bestätige bis <strong>{{frist}}</strong>, sonst wird der Platz weitergegeben.</p>
  </div>

  <p style="text-align: center; margin: 30px 0;">
    <a href="{{absage_link}}" style="display: inline-block; background: #16a34a; color: white; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-size: 18px;">Platz bestätigen</a>
  </p>

  <p style="text-align: center;">
    <a href="{{absage_link}}" style="color: #6b7280;">Nein, ich kann leider nicht</a>
  </p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
  <p style="color: #6b7280; font-size: 14px;">Diese E-Mail wurde automatisch von BackstagePass gesendet.</p>
</div>`,
      body_text: `Gute Nachricht!

Hallo {{vorname}},

ein Platz für {{rolle}} bei {{veranstaltung}} ist frei geworden!

Veranstaltung: {{veranstaltung}}
Datum: {{datum}}
Rolle: {{rolle}}
Zeit: {{startzeit}} - {{endzeit}}

WICHTIG: Bitte bestätige bis {{frist}}, sonst wird der Platz weitergegeben.

Bestätige hier: {{absage_link}}

Wenn du nicht kannst, lass es uns bitte wissen.

---
Diese E-Mail wurde automatisch von BackstagePass gesendet.`,
      placeholders: [
        'vorname',
        'nachname',
        'veranstaltung',
        'datum',
        'rolle',
        'startzeit',
        'endzeit',
        'frist',
        'absage_link',
      ],
    },
    waitlist_timeout: {
      subject: 'Platz vergeben: {{veranstaltung}}',
      body_html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #374151;">Platz wurde weitergegeben</h1>
  <p>Hallo {{vorname}},</p>
  <p>leider hast du nicht rechtzeitig auf unsere Benachrichtigung reagiert.</p>
  <p>Der Platz für <strong>{{rolle}}</strong> bei <strong>{{veranstaltung}}</strong> wurde daher an die nächste Person auf der Warteliste vergeben.</p>

  <p>Du kannst dich aber gerne für andere Schichten anmelden:</p>
  <p><a href="{{public_link}}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Zur Anmeldung</a></p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
  <p style="color: #6b7280; font-size: 14px;">Diese E-Mail wurde automatisch von BackstagePass gesendet.</p>
</div>`,
      body_text: `Platz wurde weitergegeben

Hallo {{vorname}},

leider hast du nicht rechtzeitig auf unsere Benachrichtigung reagiert.

Der Platz für {{rolle}} bei {{veranstaltung}} wurde daher an die nächste Person auf der Warteliste vergeben.

Du kannst dich aber gerne für andere Schichten anmelden:
{{public_link}}

---
Diese E-Mail wurde automatisch von BackstagePass gesendet.`,
      placeholders: [
        'vorname',
        'nachname',
        'veranstaltung',
        'rolle',
        'public_link',
      ],
    },
    thank_you: {
      subject: 'Danke für deinen Einsatz bei {{veranstaltung}}',
      body_html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #7c3aed;">Vielen herzlichen Dank!</h1>
  <p>Liebe/r {{vorname}},</p>
  <p>vielen herzlichen Dank für deinen grossartigen Einsatz bei <strong>{{veranstaltung}}</strong>!</p>

  <p>Ohne engagierte Helfer wie dich wären unsere Veranstaltungen nicht möglich. Dein Beitrag als <strong>{{rolle}}</strong> hat massgeblich zum Erfolg beigetragen.</p>

  <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
    <p style="margin: 0; font-size: 18px;">Wir freuen uns, wenn du auch beim nächsten Mal dabei bist!</p>
  </div>

  <p>Herzliche Grüsse<br>
  Das TGW-Team</p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
  <p style="color: #6b7280; font-size: 14px;">Diese E-Mail wurde automatisch von BackstagePass gesendet.</p>
</div>`,
      body_text: `Vielen herzlichen Dank!

Liebe/r {{vorname}},

vielen herzlichen Dank für deinen grossartigen Einsatz bei {{veranstaltung}}!

Ohne engagierte Helfer wie dich wären unsere Veranstaltungen nicht möglich. Dein Beitrag als {{rolle}} hat massgeblich zum Erfolg beigetragen.

Wir freuen uns, wenn du auch beim nächsten Mal dabei bist!

Herzliche Grüsse
Das TGW-Team

---
Diese E-Mail wurde automatisch von BackstagePass gesendet.`,
      placeholders: ['vorname', 'nachname', 'veranstaltung', 'rolle'],
    },
  }

  const defaultTemplate = defaults[typ]
  if (!defaultTemplate) {
    return { success: false, error: 'Template-Typ nicht gefunden' }
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('email_templates')
    .update({
      subject: defaultTemplate.subject,
      body_html: defaultTemplate.body_html,
      body_text: defaultTemplate.body_text,
      placeholders: defaultTemplate.placeholders,
    } as never)
    .eq('typ', typ)

  if (error) {
    console.error('Error resetting email template:', error)
    return { success: false, error: 'Fehler beim Zurücksetzen des Templates' }
  }

  revalidatePath('/admin/email-templates')

  return { success: true }
}
