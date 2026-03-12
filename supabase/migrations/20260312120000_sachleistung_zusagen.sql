-- Migration: Sachleistung-Zusagen (Pledges) & Extended Sachleistungen (Issue #463)
-- Adds pledge tracking for in-kind contributions (cakes, drinks, etc.)
-- Created: 2026-03-12

-- =============================================================================
-- ALTER TABLE: sachleistungen - add kategorie and sichtbarkeit columns
-- =============================================================================

ALTER TABLE sachleistungen
  ADD COLUMN IF NOT EXISTS kategorie TEXT DEFAULT 'sonstiges'
    CHECK (kategorie IN ('kuchen', 'getraenke', 'salate', 'material', 'sonstiges')),
  ADD COLUMN IF NOT EXISTS sichtbarkeit TEXT DEFAULT 'public'
    CHECK (sichtbarkeit IN ('intern', 'public'));

COMMENT ON COLUMN sachleistungen.kategorie IS 'Kategorie der Sachleistung (kuchen, getraenke, salate, material, sonstiges)';
COMMENT ON COLUMN sachleistungen.sichtbarkeit IS 'Sichtbarkeit: public = auf Mitmach-Seite sichtbar, intern = nur fuer Vorstand';

-- =============================================================================
-- TABLE: sachleistung_zusagen (Pledges for in-kind contributions)
-- =============================================================================

CREATE TABLE IF NOT EXISTS sachleistung_zusagen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sachleistung_id UUID NOT NULL REFERENCES sachleistungen(id) ON DELETE CASCADE,
  -- Internal helper (registered person)
  person_id UUID REFERENCES personen(id),
  -- External helper (not registered)
  external_name TEXT,
  external_email TEXT,
  external_telefon TEXT,
  -- Details
  anzahl INTEGER NOT NULL DEFAULT 1,
  kommentar TEXT,
  -- Tracking
  status TEXT NOT NULL DEFAULT 'zugesagt' CHECK (status IN ('zugesagt', 'geliefert', 'storniert')),
  geliefert_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  -- Constraint: either internal or external helper, not both
  CONSTRAINT check_helfer_type CHECK (
    (person_id IS NOT NULL AND external_name IS NULL) OR
    (person_id IS NULL AND external_name IS NOT NULL)
  )
);

-- Enable Row Level Security
ALTER TABLE sachleistung_zusagen ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS Policies for sachleistung_zusagen
-- =============================================================================

-- Policy: All authenticated users can read zusagen
CREATE POLICY "sachleistung_zusagen_select"
  ON sachleistung_zusagen FOR SELECT
  TO authenticated
  USING (true);

-- Policy: All authenticated users can insert zusagen (for self-registration)
CREATE POLICY "sachleistung_zusagen_insert"
  ON sachleistung_zusagen FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Management can update zusagen (mark as delivered, cancel)
CREATE POLICY "sachleistung_zusagen_update"
  ON sachleistung_zusagen FOR UPDATE
  TO authenticated
  USING (is_management() OR person_id = (SELECT id FROM personen WHERE profile_id = auth.uid()));

-- Policy: Management can delete zusagen
CREATE POLICY "sachleistung_zusagen_delete"
  ON sachleistung_zusagen FOR DELETE
  TO authenticated
  USING (is_management());

-- Policy: Anonymous users (public mitmach-page) can insert zusagen via service role
-- The public mitmach registration uses the admin client (service_role), so
-- no anon policy is needed here. The admin client bypasses RLS.

-- =============================================================================
-- Indexes
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_sachleistung_zusagen_sachleistung
  ON sachleistung_zusagen(sachleistung_id);

CREATE INDEX IF NOT EXISTS idx_sachleistung_zusagen_person
  ON sachleistung_zusagen(person_id)
  WHERE person_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sachleistung_zusagen_status
  ON sachleistung_zusagen(status);

CREATE INDEX IF NOT EXISTS idx_sachleistungen_sichtbarkeit
  ON sachleistungen(sichtbarkeit);

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON TABLE sachleistung_zusagen IS 'Zusagen (Pledges) fuer Sachleistungen - wer bringt was mit';
COMMENT ON COLUMN sachleistung_zusagen.person_id IS 'Interner Helfer (registrierte Person)';
COMMENT ON COLUMN sachleistung_zusagen.external_name IS 'Name des externen Helfers (nicht registriert)';
COMMENT ON COLUMN sachleistung_zusagen.status IS 'zugesagt = versprochen, geliefert = tatsaechlich gebracht, storniert = abgesagt';
COMMENT ON COLUMN sachleistung_zusagen.geliefert_at IS 'Zeitstempel der tatsaechlichen Lieferung';
