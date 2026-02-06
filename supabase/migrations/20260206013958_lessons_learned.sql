-- Migration: Lessons Learned
-- Issue #175: Nachbearbeitung & Historie - Dokumentation von Erkenntnissen

-- =============================================================================
-- TABLE: lessons_learned
-- Stores lessons learned after performances/events
-- =============================================================================

CREATE TABLE IF NOT EXISTS lessons_learned (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veranstaltung_id UUID NOT NULL REFERENCES veranstaltungen(id) ON DELETE CASCADE,
  kategorie TEXT NOT NULL CHECK (kategorie IN ('positiv', 'verbesserung', 'problem', 'idee')),
  titel TEXT NOT NULL,
  beschreibung TEXT,
  prioritaet TEXT CHECK (prioritaet IN ('niedrig', 'mittel', 'hoch')),
  status TEXT NOT NULL DEFAULT 'offen' CHECK (status IN ('offen', 'in_bearbeitung', 'erledigt', 'verworfen')),
  verantwortlich_id UUID REFERENCES personen(id) ON DELETE SET NULL,
  erstellt_von UUID REFERENCES profiles(id) ON DELETE SET NULL,
  erledigt_am TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- Indexes
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_lessons_learned_veranstaltung
  ON lessons_learned(veranstaltung_id);
CREATE INDEX IF NOT EXISTS idx_lessons_learned_kategorie
  ON lessons_learned(kategorie);
CREATE INDEX IF NOT EXISTS idx_lessons_learned_status
  ON lessons_learned(status);
CREATE INDEX IF NOT EXISTS idx_lessons_learned_verantwortlich
  ON lessons_learned(verantwortlich_id);

-- =============================================================================
-- Triggers
-- =============================================================================

CREATE TRIGGER set_lessons_learned_updated_at
  BEFORE UPDATE ON lessons_learned
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- RLS
-- =============================================================================

ALTER TABLE lessons_learned ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view lessons_learned"
  ON lessons_learned FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Management can insert lessons_learned"
  ON lessons_learned FOR INSERT
  TO authenticated
  WITH CHECK (is_management());

CREATE POLICY "Management can update lessons_learned"
  ON lessons_learned FOR UPDATE
  TO authenticated
  USING (is_management())
  WITH CHECK (is_management());

CREATE POLICY "Management can delete lessons_learned"
  ON lessons_learned FOR DELETE
  TO authenticated
  USING (is_management());

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON TABLE lessons_learned IS 'Lessons learned from events for continuous improvement';
COMMENT ON COLUMN lessons_learned.kategorie IS 'Category: positiv (what went well), verbesserung (improvement), problem (issue), idee (idea)';
COMMENT ON COLUMN lessons_learned.prioritaet IS 'Priority level for action items';
COMMENT ON COLUMN lessons_learned.status IS 'Status: offen (open), in_bearbeitung (in progress), erledigt (done), verworfen (dismissed)';
