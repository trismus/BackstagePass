-- Migration: Add upcoming_schedule email template type
-- Created: 2026-04-20
-- Description: Send a weekly schedule overview to all confirmed helpers (System B)

-- =============================================================================
-- Extend CHECK constraint to include 'upcoming_schedule'
-- =============================================================================

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
    'member_invitation',
    'upcoming_schedule'
  ));

-- =============================================================================
-- Insert default upcoming_schedule template
-- =============================================================================

INSERT INTO email_templates (typ, subject, body_html, body_text, placeholders)
VALUES (
  'upcoming_schedule',
  'Deine nächsten Einsätze – Theatergruppe Widen',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #7c3aed;">Deine nächsten Einsätze</h1>
  <p>Hallo {{vorname}},</p>
  <p>hier ist eine Übersicht deiner bestätigten Einsätze in den nächsten 14 Tagen:</p>

  {{termine_liste}}

  <p>Bei Fragen wende dich an die Koordination:</p>
  <p><strong>{{koordinator_name}}</strong><br>
  <a href="mailto:{{koordinator_email}}" style="color: #7c3aed;">{{koordinator_email}}</a><br>
  {{koordinator_telefon}}</p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
  <p style="color: #6b7280; font-size: 14px;">Diese E-Mail wurde automatisch von BackstagePass gesendet.<br>
  Theatergruppe Widen | <a href="https://www.theatergruppe-widen.ch" style="color: #7c3aed;">www.theatergruppe-widen.ch</a></p>
</div>',
  'Deine nächsten Einsätze – Theatergruppe Widen

Hallo {{vorname}},

hier ist eine Übersicht deiner bestätigten Einsätze in den nächsten 14 Tagen:

{{termine_liste}}

Bei Fragen wende dich an die Koordination:
{{koordinator_name}}
{{koordinator_email}}
{{koordinator_telefon}}

---
Diese E-Mail wurde automatisch von BackstagePass gesendet.
Theatergruppe Widen | www.theatergruppe-widen.ch',
  ARRAY['vorname', 'termine_liste', 'koordinator_name', 'koordinator_email', 'koordinator_telefon']
)
ON CONFLICT (typ) DO NOTHING;
