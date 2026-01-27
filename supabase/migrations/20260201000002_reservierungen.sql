-- Migration: Create raum_reservierungen and ressourcen_reservierungen tables
-- Created: 2026-02-01
-- Description: Reservations for rooms and resources (Issue #98)
-- Note: This migration is idempotent (can be run multiple times safely)

-- =============================================================================
-- TABLE: raum_reservierungen (Room Reservations)
-- =============================================================================

CREATE TABLE IF NOT EXISTS raum_reservierungen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veranstaltung_id UUID NOT NULL REFERENCES veranstaltungen(id) ON DELETE CASCADE,
  raum_id UUID NOT NULL REFERENCES raeume(id) ON DELETE CASCADE,
  notizen TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(veranstaltung_id, raum_id)
);

-- Enable Row Level Security
ALTER TABLE raum_reservierungen ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "raum_reservierungen_select" ON raum_reservierungen;
DROP POLICY IF EXISTS "raum_reservierungen_insert" ON raum_reservierungen;
DROP POLICY IF EXISTS "raum_reservierungen_update" ON raum_reservierungen;
DROP POLICY IF EXISTS "raum_reservierungen_delete" ON raum_reservierungen;

-- Policy: All authenticated users can read reservations
CREATE POLICY "raum_reservierungen_select"
  ON raum_reservierungen FOR SELECT
  TO authenticated
  USING (true);

-- Policy: EDITOR and ADMIN can manage reservations
CREATE POLICY "raum_reservierungen_insert"
  ON raum_reservierungen FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'EDITOR')
    )
  );

CREATE POLICY "raum_reservierungen_update"
  ON raum_reservierungen FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'EDITOR')
    )
  );

CREATE POLICY "raum_reservierungen_delete"
  ON raum_reservierungen FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'EDITOR')
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS raum_reservierungen_veranstaltung_idx ON raum_reservierungen(veranstaltung_id);
CREATE INDEX IF NOT EXISTS raum_reservierungen_raum_idx ON raum_reservierungen(raum_id);

-- =============================================================================
-- TABLE: ressourcen_reservierungen (Resource Reservations)
-- =============================================================================

CREATE TABLE IF NOT EXISTS ressourcen_reservierungen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veranstaltung_id UUID NOT NULL REFERENCES veranstaltungen(id) ON DELETE CASCADE,
  ressource_id UUID NOT NULL REFERENCES ressourcen(id) ON DELETE CASCADE,
  menge INTEGER DEFAULT 1,
  notizen TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(veranstaltung_id, ressource_id)
);

-- Enable Row Level Security
ALTER TABLE ressourcen_reservierungen ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "ressourcen_reservierungen_select" ON ressourcen_reservierungen;
DROP POLICY IF EXISTS "ressourcen_reservierungen_insert" ON ressourcen_reservierungen;
DROP POLICY IF EXISTS "ressourcen_reservierungen_update" ON ressourcen_reservierungen;
DROP POLICY IF EXISTS "ressourcen_reservierungen_delete" ON ressourcen_reservierungen;

-- Policy: All authenticated users can read reservations
CREATE POLICY "ressourcen_reservierungen_select"
  ON ressourcen_reservierungen FOR SELECT
  TO authenticated
  USING (true);

-- Policy: EDITOR and ADMIN can manage reservations
CREATE POLICY "ressourcen_reservierungen_insert"
  ON ressourcen_reservierungen FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'EDITOR')
    )
  );

CREATE POLICY "ressourcen_reservierungen_update"
  ON ressourcen_reservierungen FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'EDITOR')
    )
  );

CREATE POLICY "ressourcen_reservierungen_delete"
  ON ressourcen_reservierungen FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'EDITOR')
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS ressourcen_reservierungen_veranstaltung_idx ON ressourcen_reservierungen(veranstaltung_id);
CREATE INDEX IF NOT EXISTS ressourcen_reservierungen_ressource_idx ON ressourcen_reservierungen(ressource_id);
