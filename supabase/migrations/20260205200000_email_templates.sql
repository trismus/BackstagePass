-- Migration: Email Templates for Communication System
-- Created: 2026-02-05
-- Issue: #220
-- Description: Template system for automated emails (booking confirmation, reminders, etc.)

-- =============================================================================
-- TABLE: email_templates
-- =============================================================================

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  typ TEXT NOT NULL UNIQUE CHECK (typ IN (
    'confirmation',
    'reminder_48h',
    'reminder_6h',
    'cancellation',
    'waitlist_assigned',
    'waitlist_timeout',
    'thank_you'
  )),
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT NOT NULL,
  placeholders TEXT[] NOT NULL DEFAULT '{}',
  aktiv BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

-- Policy: Admin can do everything
CREATE POLICY "email_templates_admin_all"
  ON email_templates FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Policy: Management can read templates
CREATE POLICY "email_templates_management_select"
  ON email_templates FOR SELECT
  TO authenticated
  USING (is_management());

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_email_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS email_templates_updated_at_trigger ON email_templates;
CREATE TRIGGER email_templates_updated_at_trigger
  BEFORE UPDATE ON email_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_email_templates_updated_at();

-- Create index
CREATE INDEX IF NOT EXISTS email_templates_typ_idx ON email_templates(typ);
CREATE INDEX IF NOT EXISTS email_templates_aktiv_idx ON email_templates(aktiv);

-- =============================================================================
-- SEED DATA: Default email templates
-- =============================================================================

-- Define available placeholders for documentation
-- {{vorname}}, {{nachname}}, {{email}}
-- {{veranstaltung}}, {{datum}}, {{uhrzeit}}, {{ort}}
-- {{rolle}}, {{zeitblock}}, {{startzeit}}, {{endzeit}}
-- {{treffpunkt}}, {{briefing_zeit}}, {{helferessen_zeit}}
-- {{absage_link}}, {{public_link}}
-- {{koordinator_name}}, {{koordinator_email}}, {{koordinator_telefon}}
-- {{frist}} (for waitlist timeout)

INSERT INTO email_templates (typ, subject, body_html, body_text, placeholders)
VALUES
  -- Confirmation email
  (
    'confirmation',
    'Bestätigung: Helfereinsatz bei {{veranstaltung}}',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
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
</div>',
    'Vielen Dank für deine Anmeldung!

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
Diese E-Mail wurde automatisch von BackstagePass gesendet.',
    ARRAY['vorname', 'nachname', 'veranstaltung', 'datum', 'rolle', 'zeitblock', 'startzeit', 'endzeit', 'ort', 'treffpunkt', 'briefing_zeit', 'helferessen_zeit', 'absage_link', 'koordinator_name', 'koordinator_email', 'koordinator_telefon']
  ),

  -- 48h Reminder email
  (
    'reminder_48h',
    'Erinnerung: Helfereinsatz morgen bei {{veranstaltung}}',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
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
</div>',
    'Nicht vergessen: Morgen ist es soweit!

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
Diese E-Mail wurde automatisch von BackstagePass gesendet.',
    ARRAY['vorname', 'nachname', 'veranstaltung', 'datum', 'rolle', 'startzeit', 'endzeit', 'ort', 'treffpunkt', 'briefing_zeit', 'koordinator_name', 'koordinator_email', 'koordinator_telefon']
  ),

  -- 6h Reminder email
  (
    'reminder_6h',
    'Heute: Helfereinsatz bei {{veranstaltung}}',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
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
</div>',
    'Heute ist es soweit!

Hallo {{vorname}},

in wenigen Stunden beginnt dein Einsatz bei {{veranstaltung}}.

STARTZEIT: {{startzeit}} Uhr
Treffpunkt: {{treffpunkt}}

Rolle: {{rolle}}
Ort: {{ort}}

Bis gleich!

Notfall-Kontakt: {{koordinator_telefon}}

---
Diese E-Mail wurde automatisch von BackstagePass gesendet.',
    ARRAY['vorname', 'nachname', 'veranstaltung', 'startzeit', 'treffpunkt', 'rolle', 'ort', 'koordinator_telefon']
  ),

  -- Cancellation email (sent when user cancels)
  (
    'cancellation',
    'Abmeldung bestätigt: {{veranstaltung}}',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
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
</div>',
    'Deine Abmeldung wurde bestätigt

Hallo {{vorname}},

deine Abmeldung von {{veranstaltung}} wurde erfolgreich verarbeitet.

Veranstaltung: {{veranstaltung}}
Datum: {{datum}}
Rolle: {{rolle}}

Schade, dass du nicht dabei sein kannst. Wir hoffen, dich beim nächsten Mal zu sehen!

Du kannst dich jederzeit wieder für andere Schichten anmelden:
{{public_link}}

---
Diese E-Mail wurde automatisch von BackstagePass gesendet.',
    ARRAY['vorname', 'nachname', 'veranstaltung', 'datum', 'rolle', 'public_link']
  ),

  -- Waitlist assigned email
  (
    'waitlist_assigned',
    'Ein Platz ist frei: {{rolle}} bei {{veranstaltung}}',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
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
</div>',
    'Gute Nachricht!

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
Diese E-Mail wurde automatisch von BackstagePass gesendet.',
    ARRAY['vorname', 'nachname', 'veranstaltung', 'datum', 'rolle', 'startzeit', 'endzeit', 'frist', 'absage_link']
  ),

  -- Waitlist timeout email
  (
    'waitlist_timeout',
    'Platz vergeben: {{veranstaltung}}',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #374151;">Platz wurde weitergegeben</h1>
  <p>Hallo {{vorname}},</p>
  <p>leider hast du nicht rechtzeitig auf unsere Benachrichtigung reagiert.</p>
  <p>Der Platz für <strong>{{rolle}}</strong> bei <strong>{{veranstaltung}}</strong> wurde daher an die nächste Person auf der Warteliste vergeben.</p>

  <p>Du kannst dich aber gerne für andere Schichten anmelden:</p>
  <p><a href="{{public_link}}" style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Zur Anmeldung</a></p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
  <p style="color: #6b7280; font-size: 14px;">Diese E-Mail wurde automatisch von BackstagePass gesendet.</p>
</div>',
    'Platz wurde weitergegeben

Hallo {{vorname}},

leider hast du nicht rechtzeitig auf unsere Benachrichtigung reagiert.

Der Platz für {{rolle}} bei {{veranstaltung}} wurde daher an die nächste Person auf der Warteliste vergeben.

Du kannst dich aber gerne für andere Schichten anmelden:
{{public_link}}

---
Diese E-Mail wurde automatisch von BackstagePass gesendet.',
    ARRAY['vorname', 'nachname', 'veranstaltung', 'rolle', 'public_link']
  ),

  -- Thank you email
  (
    'thank_you',
    'Danke für deinen Einsatz bei {{veranstaltung}}',
    '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
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
</div>',
    'Vielen herzlichen Dank!

Liebe/r {{vorname}},

vielen herzlichen Dank für deinen grossartigen Einsatz bei {{veranstaltung}}!

Ohne engagierte Helfer wie dich wären unsere Veranstaltungen nicht möglich. Dein Beitrag als {{rolle}} hat massgeblich zum Erfolg beigetragen.

Wir freuen uns, wenn du auch beim nächsten Mal dabei bist!

Herzliche Grüsse
Das TGW-Team

---
Diese E-Mail wurde automatisch von BackstagePass gesendet.',
    ARRAY['vorname', 'nachname', 'veranstaltung', 'rolle']
  )
ON CONFLICT (typ) DO NOTHING;
