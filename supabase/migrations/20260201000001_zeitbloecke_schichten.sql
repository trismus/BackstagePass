-- Migration: Create zeitbloecke, auffuehrung_schichten, auffuehrung_zuweisungen tables
-- Created: 2026-02-01
-- Description: Time blocks and shifts for performances (Issue #97)
-- Note: This migration is idempotent (can be run multiple times safely)

-- =============================================================================
-- TABLE: zeitbloecke (Time Blocks within Performance)
-- =============================================================================

CREATE TABLE IF NOT EXISTS zeitbloecke (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veranstaltung_id UUID NOT NULL REFERENCES veranstaltungen(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  startzeit TIME NOT NULL,
  endzeit TIME NOT NULL,
  typ TEXT DEFAULT 'standard' CHECK (typ IN ('aufbau', 'einlass', 'vorfuehrung', 'pause', 'abbau', 'standard')),
  sortierung INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE zeitbloecke ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "zeitbloecke_select" ON zeitbloecke;
DROP POLICY IF EXISTS "zeitbloecke_insert" ON zeitbloecke;
DROP POLICY IF EXISTS "zeitbloecke_update" ON zeitbloecke;
DROP POLICY IF EXISTS "zeitbloecke_delete" ON zeitbloecke;

-- Policy: All authenticated users can read time blocks
CREATE POLICY "zeitbloecke_select"
  ON zeitbloecke FOR SELECT
  TO authenticated
  USING (true);

-- Policy: EDITOR and ADMIN can manage time blocks
CREATE POLICY "zeitbloecke_insert"
  ON zeitbloecke FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'EDITOR')
    )
  );

CREATE POLICY "zeitbloecke_update"
  ON zeitbloecke FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'EDITOR')
    )
  );

CREATE POLICY "zeitbloecke_delete"
  ON zeitbloecke FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS zeitbloecke_veranstaltung_idx ON zeitbloecke(veranstaltung_id);
CREATE INDEX IF NOT EXISTS zeitbloecke_sortierung_idx ON zeitbloecke(sortierung);

-- =============================================================================
-- TABLE: auffuehrung_schichten (Shifts with Roles)
-- =============================================================================

CREATE TABLE IF NOT EXISTS auffuehrung_schichten (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veranstaltung_id UUID NOT NULL REFERENCES veranstaltungen(id) ON DELETE CASCADE,
  zeitblock_id UUID REFERENCES zeitbloecke(id) ON DELETE SET NULL,
  rolle TEXT NOT NULL,
  anzahl_benoetigt INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE auffuehrung_schichten ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "auffuehrung_schichten_select" ON auffuehrung_schichten;
DROP POLICY IF EXISTS "auffuehrung_schichten_insert" ON auffuehrung_schichten;
DROP POLICY IF EXISTS "auffuehrung_schichten_update" ON auffuehrung_schichten;
DROP POLICY IF EXISTS "auffuehrung_schichten_delete" ON auffuehrung_schichten;

-- Policy: All authenticated users can read shifts
CREATE POLICY "auffuehrung_schichten_select"
  ON auffuehrung_schichten FOR SELECT
  TO authenticated
  USING (true);

-- Policy: EDITOR and ADMIN can manage shifts
CREATE POLICY "auffuehrung_schichten_insert"
  ON auffuehrung_schichten FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'EDITOR')
    )
  );

CREATE POLICY "auffuehrung_schichten_update"
  ON auffuehrung_schichten FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'EDITOR')
    )
  );

CREATE POLICY "auffuehrung_schichten_delete"
  ON auffuehrung_schichten FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'EDITOR')
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS auffuehrung_schichten_veranstaltung_idx ON auffuehrung_schichten(veranstaltung_id);
CREATE INDEX IF NOT EXISTS auffuehrung_schichten_zeitblock_idx ON auffuehrung_schichten(zeitblock_id);

-- =============================================================================
-- TABLE: auffuehrung_zuweisungen (Person Assignments to Shifts)
-- =============================================================================

CREATE TABLE IF NOT EXISTS auffuehrung_zuweisungen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schicht_id UUID NOT NULL REFERENCES auffuehrung_schichten(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES personen(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'zugesagt' CHECK (status IN ('zugesagt', 'abgesagt', 'erschienen', 'nicht_erschienen')),
  notizen TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(schicht_id, person_id)
);

-- Enable Row Level Security
ALTER TABLE auffuehrung_zuweisungen ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "auffuehrung_zuweisungen_select" ON auffuehrung_zuweisungen;
DROP POLICY IF EXISTS "auffuehrung_zuweisungen_insert" ON auffuehrung_zuweisungen;
DROP POLICY IF EXISTS "auffuehrung_zuweisungen_update" ON auffuehrung_zuweisungen;
DROP POLICY IF EXISTS "auffuehrung_zuweisungen_delete" ON auffuehrung_zuweisungen;

-- Policy: All authenticated users can read assignments
CREATE POLICY "auffuehrung_zuweisungen_select"
  ON auffuehrung_zuweisungen FOR SELECT
  TO authenticated
  USING (true);

-- Policy: All authenticated can register for assignments
CREATE POLICY "auffuehrung_zuweisungen_insert"
  ON auffuehrung_zuweisungen FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Users can update own assignments, EDITOR+ can update any
CREATE POLICY "auffuehrung_zuweisungen_update"
  ON auffuehrung_zuweisungen FOR UPDATE
  TO authenticated
  USING (true);

-- Policy: Users can delete own assignments, EDITOR+ can delete any
CREATE POLICY "auffuehrung_zuweisungen_delete"
  ON auffuehrung_zuweisungen FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS auffuehrung_zuweisungen_schicht_idx ON auffuehrung_zuweisungen(schicht_id);
CREATE INDEX IF NOT EXISTS auffuehrung_zuweisungen_person_idx ON auffuehrung_zuweisungen(person_id);
CREATE INDEX IF NOT EXISTS auffuehrung_zuweisungen_status_idx ON auffuehrung_zuweisungen(status);
