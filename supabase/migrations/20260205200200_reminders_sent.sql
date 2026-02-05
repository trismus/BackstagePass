-- Migration: Reminders Sent Tracking
-- Created: 2026-02-05
-- Issue: #222
-- Description: Track which reminders have been sent to avoid duplicates

-- =============================================================================
-- TABLE: reminders_sent
-- =============================================================================

CREATE TABLE IF NOT EXISTS reminders_sent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anmeldung_id UUID NOT NULL REFERENCES auffuehrung_zuweisungen(id) ON DELETE CASCADE,
  reminder_typ TEXT NOT NULL CHECK (reminder_typ IN ('48h', '6h')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: only one reminder of each type per anmeldung
  CONSTRAINT unique_reminder UNIQUE (anmeldung_id, reminder_typ)
);

-- Enable Row Level Security
ALTER TABLE reminders_sent ENABLE ROW LEVEL SECURITY;

-- Policy: Admin can see all reminders
CREATE POLICY "reminders_sent_admin_select"
  ON reminders_sent FOR SELECT
  TO authenticated
  USING (is_admin());

-- Policy: Management can see reminders
CREATE POLICY "reminders_sent_management_select"
  ON reminders_sent FOR SELECT
  TO authenticated
  USING (is_management());

-- Create indexes
CREATE INDEX IF NOT EXISTS reminders_sent_anmeldung_idx ON reminders_sent(anmeldung_id);
CREATE INDEX IF NOT EXISTS reminders_sent_typ_idx ON reminders_sent(reminder_typ);
CREATE INDEX IF NOT EXISTS reminders_sent_sent_at_idx ON reminders_sent(sent_at);

-- =============================================================================
-- ADD: reminder_config to veranstaltungen (optional per-event config)
-- =============================================================================

ALTER TABLE veranstaltungen
ADD COLUMN IF NOT EXISTS reminder_config JSONB DEFAULT '{"send_48h": true, "send_6h": true}'::jsonb;

-- Example reminder_config:
-- {
--   "send_48h": true,
--   "send_6h": true,
--   "custom_hours": [72, 24]  -- optional: custom reminder times in hours
-- }

-- =============================================================================
-- VIEW: Upcoming reminders to send
-- =============================================================================

CREATE OR REPLACE VIEW pending_reminders_48h AS
SELECT
  z.id AS zuweisung_id,
  z.person_id,
  z.schicht_id,
  v.id AS veranstaltung_id,
  v.titel AS veranstaltung_titel,
  v.datum,
  v.startzeit,
  v.ort,
  v.koordinator_id,
  s.rolle,
  zb.name AS zeitblock_name,
  zb.startzeit AS schicht_startzeit,
  zb.endzeit AS schicht_endzeit,
  p.vorname,
  p.nachname,
  p.email
FROM auffuehrung_zuweisungen z
JOIN auffuehrung_schichten s ON s.id = z.schicht_id
JOIN veranstaltungen v ON v.id = s.veranstaltung_id
JOIN personen p ON p.id = z.person_id
LEFT JOIN zeitbloecke zb ON zb.id = s.zeitblock_id
WHERE
  z.status = 'zugesagt'
  AND v.status IN ('geplant', 'bestaetigt')
  AND v.datum::date + COALESCE(v.startzeit::time, '00:00'::time)
      BETWEEN NOW() + INTERVAL '45 hours' AND NOW() + INTERVAL '51 hours'
  AND p.email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM reminders_sent rs
    WHERE rs.anmeldung_id = z.id AND rs.reminder_typ = '48h'
  )
  AND (v.reminder_config IS NULL OR (v.reminder_config->>'send_48h')::boolean != false);

CREATE OR REPLACE VIEW pending_reminders_6h AS
SELECT
  z.id AS zuweisung_id,
  z.person_id,
  z.schicht_id,
  v.id AS veranstaltung_id,
  v.titel AS veranstaltung_titel,
  v.datum,
  v.startzeit,
  v.ort,
  v.koordinator_id,
  s.rolle,
  zb.name AS zeitblock_name,
  zb.startzeit AS schicht_startzeit,
  zb.endzeit AS schicht_endzeit,
  p.vorname,
  p.nachname,
  p.email
FROM auffuehrung_zuweisungen z
JOIN auffuehrung_schichten s ON s.id = z.schicht_id
JOIN veranstaltungen v ON v.id = s.veranstaltung_id
JOIN personen p ON p.id = z.person_id
LEFT JOIN zeitbloecke zb ON zb.id = s.zeitblock_id
WHERE
  z.status = 'zugesagt'
  AND v.status IN ('geplant', 'bestaetigt')
  AND v.datum::date + COALESCE(v.startzeit::time, '00:00'::time)
      BETWEEN NOW() + INTERVAL '5 hours' AND NOW() + INTERVAL '7 hours'
  AND p.email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM reminders_sent rs
    WHERE rs.anmeldung_id = z.id AND rs.reminder_typ = '6h'
  )
  AND (v.reminder_config IS NULL OR (v.reminder_config->>'send_6h')::boolean != false);

-- =============================================================================
-- Grant access to views
-- =============================================================================

GRANT SELECT ON pending_reminders_48h TO authenticated;
GRANT SELECT ON pending_reminders_6h TO authenticated;
