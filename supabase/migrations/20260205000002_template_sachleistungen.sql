-- Migration: Template Sachleistungen & Seed Data (Issue #202)
-- Creates sachleistungen tables and seeds "Abendvorstellung" template
-- Created: 2026-02-05

-- =============================================================================
-- TABLE: template_sachleistungen (Template-level in-kind contributions)
-- =============================================================================

CREATE TABLE IF NOT EXISTS template_sachleistungen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES auffuehrung_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  anzahl INTEGER NOT NULL DEFAULT 1,
  beschreibung TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE template_sachleistungen ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read template sachleistungen
CREATE POLICY "template_sachleistungen_select"
  ON template_sachleistungen FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Management can manage template sachleistungen
CREATE POLICY "template_sachleistungen_insert"
  ON template_sachleistungen FOR INSERT
  TO authenticated
  WITH CHECK (is_management());

CREATE POLICY "template_sachleistungen_update"
  ON template_sachleistungen FOR UPDATE
  TO authenticated
  USING (is_management());

CREATE POLICY "template_sachleistungen_delete"
  ON template_sachleistungen FOR DELETE
  TO authenticated
  USING (is_management());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_template_sachleistungen_template
  ON template_sachleistungen(template_id);

-- =============================================================================
-- TABLE: sachleistungen (Instance-level in-kind contributions)
-- =============================================================================

CREATE TABLE IF NOT EXISTS sachleistungen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veranstaltung_id UUID NOT NULL REFERENCES veranstaltungen(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  anzahl INTEGER NOT NULL DEFAULT 1,
  beschreibung TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE sachleistungen ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read sachleistungen
CREATE POLICY "sachleistungen_select"
  ON sachleistungen FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Management can manage sachleistungen
CREATE POLICY "sachleistungen_insert"
  ON sachleistungen FOR INSERT
  TO authenticated
  WITH CHECK (is_management());

CREATE POLICY "sachleistungen_update"
  ON sachleistungen FOR UPDATE
  TO authenticated
  USING (is_management());

CREATE POLICY "sachleistungen_delete"
  ON sachleistungen FOR DELETE
  TO authenticated
  USING (is_management());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sachleistungen_veranstaltung
  ON sachleistungen(veranstaltung_id);

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON TABLE template_sachleistungen IS 'Sachleistungen (z.B. Kuchen, Salate) auf Template-Ebene';
COMMENT ON COLUMN template_sachleistungen.anzahl IS 'Benötigte Anzahl der Sachleistung';

COMMENT ON TABLE sachleistungen IS 'Sachleistungen für konkrete Veranstaltungen';

-- =============================================================================
-- SEED DATA: "Abendvorstellung" Template
-- =============================================================================

-- Create the template
INSERT INTO auffuehrung_templates (id, name, beschreibung)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Abendvorstellung',
  'Standard-Template für Abendvorstellungen mit allen Helfer-Schichten und Info-Blöcken'
)
ON CONFLICT (id) DO NOTHING;

-- Create Zeitblöcke (time blocks)
-- Offset is relative to show start (19:00 = 0)
-- Negative offset = before show start
INSERT INTO template_zeitbloecke (template_id, name, offset_minuten, dauer_minuten, typ, sortierung)
VALUES
  -- Aufbau Saal: 15:00-16:45 (offset -240, duration 105)
  ('a0000000-0000-0000-0000-000000000001', 'Aufbau Saal', -240, 105, 'aufbau', 1),
  -- Parkplatz: 17:45-20:00 (offset -75, duration 135)
  ('a0000000-0000-0000-0000-000000000001', 'Parkplatz', -75, 135, 'standard', 2),
  -- Kasse: 18:00-20:00 (offset -60, duration 120)
  ('a0000000-0000-0000-0000-000000000001', 'Kasse', -60, 120, 'einlass', 3),
  -- Essensservice: 18:00-20:00 (offset -60, duration 120)
  ('a0000000-0000-0000-0000-000000000001', 'Essensservice', -60, 120, 'standard', 4),
  -- Allgemeiner Service: 18:00-23:00 (offset -60, duration 300)
  ('a0000000-0000-0000-0000-000000000001', 'Allgemeiner Service', -60, 300, 'standard', 5),
  -- Getränkebuffet: 18:00-23:00 (offset -60, duration 300)
  ('a0000000-0000-0000-0000-000000000001', 'Getränkebuffet', -60, 300, 'standard', 6),
  -- Kuchen/Kaffee-Buffet: 18:00-23:00 (offset -60, duration 300)
  ('a0000000-0000-0000-0000-000000000001', 'Kuchen/Kaffee-Buffet', -60, 300, 'standard', 7),
  -- Abwasch: 18:00-23:00 (offset -60, duration 300)
  ('a0000000-0000-0000-0000-000000000001', 'Abwasch', -60, 300, 'standard', 8),
  -- Bar: 18:00-23:00 (offset -60, duration 300)
  ('a0000000-0000-0000-0000-000000000001', 'Bar', -60, 300, 'standard', 9),
  -- Springer: 18:00-20:00 (offset -60, duration 120)
  ('a0000000-0000-0000-0000-000000000001', 'Springer', -60, 120, 'standard', 10)
ON CONFLICT DO NOTHING;

-- Create Schichten (shifts) with required personnel counts
INSERT INTO template_schichten (template_id, zeitblock_name, rolle, anzahl_benoetigt)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Aufbau Saal', 'Aufbau Saal', 4),
  ('a0000000-0000-0000-0000-000000000001', 'Parkplatz', 'Parkplatz', 1),
  ('a0000000-0000-0000-0000-000000000001', 'Kasse', 'Kasse', 2),
  ('a0000000-0000-0000-0000-000000000001', 'Essensservice', 'Essensservice', 3),
  ('a0000000-0000-0000-0000-000000000001', 'Allgemeiner Service', 'Allgemeiner Service', 4),
  ('a0000000-0000-0000-0000-000000000001', 'Getränkebuffet', 'Getränkebuffet', 2),
  ('a0000000-0000-0000-0000-000000000001', 'Kuchen/Kaffee-Buffet', 'Kuchen/Kaffee-Buffet', 2),
  ('a0000000-0000-0000-0000-000000000001', 'Abwasch', 'Abwasch', 3),
  ('a0000000-0000-0000-0000-000000000001', 'Bar', 'Bar', 2),
  ('a0000000-0000-0000-0000-000000000001', 'Springer', 'Springer', 1)
ON CONFLICT DO NOTHING;

-- Create Info-Blöcke (info blocks)
INSERT INTO template_info_bloecke (template_id, titel, beschreibung, offset_minuten, dauer_minuten, sortierung)
VALUES
  -- Helferessen (Spaghetti): 16:45-17:30 (offset -135, duration 45)
  ('a0000000-0000-0000-0000-000000000001', 'Helferessen (Spaghetti)', 'Gemeinsames Essen für alle Helfer vor der Vorstellung', -135, 45, 1),
  -- Pflichtbriefing: 17:30-17:45 (offset -90, duration 15)
  ('a0000000-0000-0000-0000-000000000001', 'Pflichtbriefing', 'Kurzes Briefing für alle Helfer - Anwesenheitspflicht!', -90, 15, 2)
ON CONFLICT DO NOTHING;
