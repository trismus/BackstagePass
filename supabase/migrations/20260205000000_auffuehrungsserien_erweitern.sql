-- Migration: Extend auffuehrungsserien (Issue #201)
-- Adds stueck_id, datum_von, datum_bis fields for better series management
-- Created: 2026-02-05

-- =============================================================================
-- Add new columns to auffuehrungsserien
-- =============================================================================

-- Add stueck_id for direct reference to the play (independent of produktion)
ALTER TABLE auffuehrungsserien
  ADD COLUMN IF NOT EXISTS stueck_id UUID REFERENCES stuecke(id) ON DELETE SET NULL;

-- Add date range for the series
ALTER TABLE auffuehrungsserien
  ADD COLUMN IF NOT EXISTS datum_von DATE;

ALTER TABLE auffuehrungsserien
  ADD COLUMN IF NOT EXISTS datum_bis DATE;

-- =============================================================================
-- Indexes
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_auffuehrungsserien_stueck
  ON auffuehrungsserien(stueck_id);

CREATE INDEX IF NOT EXISTS idx_auffuehrungsserien_datum_von
  ON auffuehrungsserien(datum_von);

CREATE INDEX IF NOT EXISTS idx_auffuehrungsserien_datum_bis
  ON auffuehrungsserien(datum_bis);

-- =============================================================================
-- Validation constraint for date range
-- =============================================================================

ALTER TABLE auffuehrungsserien
  ADD CONSTRAINT auffuehrungsserien_datum_range_check
  CHECK (datum_bis IS NULL OR datum_von IS NULL OR datum_bis >= datum_von);

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON COLUMN auffuehrungsserien.stueck_id IS 'Direkter Bezug zum Stück (optional, ergänzt den Bezug über produktion)';
COMMENT ON COLUMN auffuehrungsserien.datum_von IS 'Startdatum der Aufführungsserie';
COMMENT ON COLUMN auffuehrungsserien.datum_bis IS 'Enddatum der Aufführungsserie';
