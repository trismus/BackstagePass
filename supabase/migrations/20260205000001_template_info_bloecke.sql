-- Migration: Template Info-Blöcke (Issue #203)
-- Creates tables for info blocks (Helferessen, Briefing, Treffpunkt etc.)
-- Both at template level (offset-based) and instance level (calculated times)
-- Created: 2026-02-05

-- =============================================================================
-- TABLE: template_info_bloecke (Template-level info blocks, offset-based)
-- =============================================================================

CREATE TABLE IF NOT EXISTS template_info_bloecke (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES auffuehrung_templates(id) ON DELETE CASCADE,
  titel TEXT NOT NULL,
  beschreibung TEXT,
  offset_minuten INTEGER NOT NULL DEFAULT 0,
  dauer_minuten INTEGER NOT NULL DEFAULT 30,
  sortierung INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE template_info_bloecke ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read template info blocks
CREATE POLICY "template_info_bloecke_select"
  ON template_info_bloecke FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Management can manage template info blocks
CREATE POLICY "template_info_bloecke_insert"
  ON template_info_bloecke FOR INSERT
  TO authenticated
  WITH CHECK (is_management());

CREATE POLICY "template_info_bloecke_update"
  ON template_info_bloecke FOR UPDATE
  TO authenticated
  USING (is_management());

CREATE POLICY "template_info_bloecke_delete"
  ON template_info_bloecke FOR DELETE
  TO authenticated
  USING (is_management());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_template_info_bloecke_template
  ON template_info_bloecke(template_id);

CREATE INDEX IF NOT EXISTS idx_template_info_bloecke_sortierung
  ON template_info_bloecke(sortierung);

-- =============================================================================
-- TABLE: info_bloecke (Instance-level info blocks with calculated times)
-- =============================================================================

CREATE TABLE IF NOT EXISTS info_bloecke (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veranstaltung_id UUID NOT NULL REFERENCES veranstaltungen(id) ON DELETE CASCADE,
  titel TEXT NOT NULL,
  beschreibung TEXT,
  startzeit TIME NOT NULL,
  endzeit TIME NOT NULL,
  sortierung INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE info_bloecke ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can read info blocks
CREATE POLICY "info_bloecke_select"
  ON info_bloecke FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Management can manage info blocks
CREATE POLICY "info_bloecke_insert"
  ON info_bloecke FOR INSERT
  TO authenticated
  WITH CHECK (is_management());

CREATE POLICY "info_bloecke_update"
  ON info_bloecke FOR UPDATE
  TO authenticated
  USING (is_management());

CREATE POLICY "info_bloecke_delete"
  ON info_bloecke FOR DELETE
  TO authenticated
  USING (is_management());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_info_bloecke_veranstaltung
  ON info_bloecke(veranstaltung_id);

CREATE INDEX IF NOT EXISTS idx_info_bloecke_sortierung
  ON info_bloecke(sortierung);

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON TABLE template_info_bloecke IS 'Info-Blöcke auf Template-Ebene (offset-basiert). Für Helferessen, Briefing, Treffpunkt etc.';
COMMENT ON COLUMN template_info_bloecke.offset_minuten IS 'Offset in Minuten relativ zum Vorstellungsbeginn (negativ = vor, positiv = nach)';
COMMENT ON COLUMN template_info_bloecke.dauer_minuten IS 'Dauer des Info-Blocks in Minuten';

COMMENT ON TABLE info_bloecke IS 'Info-Blöcke für konkrete Veranstaltungen mit berechneten Zeiten';
COMMENT ON COLUMN info_bloecke.startzeit IS 'Berechnete Startzeit des Info-Blocks';
COMMENT ON COLUMN info_bloecke.endzeit IS 'Berechnete Endzeit des Info-Blocks';
