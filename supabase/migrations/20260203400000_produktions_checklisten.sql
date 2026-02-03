-- Migration: Produktions-Checklisten (Issue #161)
-- Phase-basierte Checklisten für Produktions-Workflow

-- =============================================================================
-- Tables
-- =============================================================================

CREATE TABLE produktions_checklisten (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produktion_id UUID NOT NULL REFERENCES produktionen(id) ON DELETE CASCADE,
  phase TEXT NOT NULL,
  label TEXT NOT NULL,
  pflicht BOOLEAN NOT NULL DEFAULT false,
  erledigt BOOLEAN NOT NULL DEFAULT false,
  erledigt_von UUID REFERENCES profiles(id) ON DELETE SET NULL,
  erledigt_am TIMESTAMPTZ,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- Indexes
-- =============================================================================

CREATE INDEX idx_prod_checklisten_produktion ON produktions_checklisten(produktion_id);
CREATE INDEX idx_prod_checklisten_phase ON produktions_checklisten(phase);
CREATE UNIQUE INDEX idx_prod_checklisten_unique ON produktions_checklisten(produktion_id, phase, label);

-- =============================================================================
-- Updated_at Trigger
-- =============================================================================

CREATE TRIGGER set_produktions_checklisten_updated_at
  BEFORE UPDATE ON produktions_checklisten
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- Row Level Security
-- =============================================================================

ALTER TABLE produktions_checklisten ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view produktions_checklisten"
  ON produktions_checklisten FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Management can insert produktions_checklisten"
  ON produktions_checklisten FOR INSERT
  TO authenticated
  WITH CHECK (is_management());

CREATE POLICY "Management can update produktions_checklisten"
  ON produktions_checklisten FOR UPDATE
  TO authenticated
  USING (is_management())
  WITH CHECK (is_management());

CREATE POLICY "Management can delete produktions_checklisten"
  ON produktions_checklisten FOR DELETE
  TO authenticated
  USING (is_management());

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON TABLE produktions_checklisten IS 'Phase-basierte Checklisten für den Produktions-Workflow mit Pflicht- und optionalen Punkten';
