-- Add waitlist_confirmation email template type and seed template
-- This sends a confirmation when a user is added to the waitlist

ALTER TABLE email_templates DROP CONSTRAINT IF EXISTS email_templates_typ_check;
ALTER TABLE email_templates ADD CONSTRAINT email_templates_typ_check
  CHECK (typ IN (
    'confirmation',
    'reminder_48h',
    'reminder_6h',
    'cancellation',
    'waitlist_confirmation',
    'waitlist_assigned',
    'waitlist_timeout',
    'thank_you',
    'member_invitation'
  ));

INSERT INTO email_templates (typ, subject, body_html, body_text, placeholders)
VALUES (
  'waitlist_confirmation',
  'Warteliste: Du bist dabei bei {{veranstaltung}}',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #7c3aed;">Du stehst auf der Warteliste!</h1>
  <p>Hallo {{vorname}},</p>
  <p>du wurdest erfolgreich auf die Warteliste für <strong>{{rolle}}</strong> bei <strong>{{veranstaltung}}</strong> gesetzt.</p>

  <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h2 style="margin-top: 0; color: #374151;">Deine Wartelistendetails</h2>
    <p><strong>Veranstaltung:</strong> {{veranstaltung}}</p>
    <p><strong>Datum:</strong> {{datum}}</p>
    <p><strong>Rolle:</strong> {{rolle}}</p>
    <p><strong>Deine Position:</strong> {{position}}</p>
  </div>

  <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 0;">Wir benachrichtigen dich per E-Mail, sobald ein Platz für dich frei wird. Bitte reagiere dann rasch – du hast nur begrenzt Zeit, um den Platz zu bestätigen.</p>
  </div>

  <p>Bei Fragen wende dich an:</p>
  <p>{{koordinator_name}}<br>
  {{koordinator_email}}</p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
  <p style="color: #6b7280; font-size: 14px;">Diese E-Mail wurde automatisch von BackstagePass gesendet.</p>
</div>',
  'Du stehst auf der Warteliste!

Hallo {{vorname}},

du wurdest erfolgreich auf die Warteliste für {{rolle}} bei {{veranstaltung}} gesetzt.

DEINE WARTELISTENDETAILS
========================
Veranstaltung: {{veranstaltung}}
Datum: {{datum}}
Rolle: {{rolle}}
Deine Position: {{position}}

Wir benachrichtigen dich per E-Mail, sobald ein Platz für dich frei wird.
Bitte reagiere dann rasch – du hast nur begrenzt Zeit, um den Platz zu bestätigen.

Bei Fragen wende dich an:
{{koordinator_name}}
{{koordinator_email}}

---
Diese E-Mail wurde automatisch von BackstagePass gesendet.',
  ARRAY['vorname', 'nachname', 'veranstaltung', 'datum', 'rolle', 'position', 'koordinator_name', 'koordinator_email']
)
ON CONFLICT (typ) DO NOTHING;
