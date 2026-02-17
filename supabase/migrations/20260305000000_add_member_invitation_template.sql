-- Migration: Add member_invitation email template type
-- Created: 2026-02-17
-- Issue: #326
-- Description: Add branded invitation email template for member onboarding

-- =============================================================================
-- Extend CHECK constraint to include 'member_invitation'
-- =============================================================================

ALTER TABLE email_templates DROP CONSTRAINT IF EXISTS email_templates_typ_check;
ALTER TABLE email_templates ADD CONSTRAINT email_templates_typ_check
  CHECK (typ IN (
    'confirmation',
    'reminder_48h',
    'reminder_6h',
    'cancellation',
    'waitlist_assigned',
    'waitlist_timeout',
    'thank_you',
    'member_invitation'
  ));

-- =============================================================================
-- Insert default member_invitation template
-- =============================================================================

INSERT INTO email_templates (typ, subject, body_html, body_text, placeholders)
VALUES (
  'member_invitation',
  'Willkommen bei BackstagePass – Theatergruppe Widen',
  '<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h1 style="color: #7c3aed;">Willkommen bei BackstagePass!</h1>
  <p>Hallo {{vorname}},</p>
  <p>du wurdest eingeladen, <strong>BackstagePass</strong> zu nutzen – die Vereinsplattform der <strong>Theatergruppe Widen (TGW)</strong>.</p>

  <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h2 style="margin-top: 0; color: #374151;">Was ist BackstagePass?</h2>
    <p>BackstagePass ist unsere interne Plattform für die Organisation von Vereinsaktivitäten, Aufführungen und Helfereinsätzen. Hier kannst du:</p>
    <ul style="color: #374151;">
      <li>Dein Profil und deine Kontaktdaten verwalten</li>
      <li>Dich für Helfereinsätze anmelden</li>
      <li>Vereinstermine und Proben einsehen</li>
      <li>Mit dem Team in Kontakt bleiben</li>
    </ul>
  </div>

  <p style="text-align: center; margin: 30px 0;">
    <a href="{{magic_link}}" style="display: inline-block; background: #7c3aed; color: white; padding: 16px 32px; text-decoration: none; border-radius: 6px; font-size: 18px;">Jetzt anmelden</a>
  </p>

  <p style="color: #6b7280; font-size: 14px;">Der Link ist 24 Stunden gültig. Falls er abgelaufen ist, wende dich an den Vorstand für eine neue Einladung.</p>

  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
  <p style="color: #6b7280; font-size: 14px;">Diese E-Mail wurde automatisch von BackstagePass gesendet.<br>
  Theatergruppe Widen | <a href="https://www.theatergruppe-widen.ch" style="color: #7c3aed;">www.theatergruppe-widen.ch</a></p>
</div>',
  'Willkommen bei BackstagePass!

Hallo {{vorname}},

du wurdest eingeladen, BackstagePass zu nutzen – die Vereinsplattform der Theatergruppe Widen (TGW).

WAS IST BACKSTAGEPASS?
======================
BackstagePass ist unsere interne Plattform für die Organisation von Vereinsaktivitäten, Aufführungen und Helfereinsätzen. Hier kannst du:
- Dein Profil und deine Kontaktdaten verwalten
- Dich für Helfereinsätze anmelden
- Vereinstermine und Proben einsehen
- Mit dem Team in Kontakt bleiben

Jetzt anmelden: {{magic_link}}

Der Link ist 24 Stunden gültig. Falls er abgelaufen ist, wende dich an den Vorstand für eine neue Einladung.

---
Diese E-Mail wurde automatisch von BackstagePass gesendet.
Theatergruppe Widen | www.theatergruppe-widen.ch',
  ARRAY['vorname', 'magic_link']
)
ON CONFLICT (typ) DO NOTHING;
