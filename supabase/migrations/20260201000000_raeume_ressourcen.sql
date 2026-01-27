-- Migration: Create raeume and ressourcen tables
-- Created: 2026-02-01
-- Description: Rooms and equipment for performance logistics (Issue #98)
-- Note: This migration is idempotent (can be run multiple times safely)

-- =============================================================================
-- TABLE: raeume (Rooms)
-- =============================================================================

CREATE TABLE IF NOT EXISTS raeume (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  typ TEXT CHECK (typ IN ('buehne', 'foyer', 'lager', 'garderobe', 'technik', 'sonstiges')),
  kapazitaet INTEGER,
  beschreibung TEXT,
  aktiv BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE raeume ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "raeume_select" ON raeume;
DROP POLICY IF EXISTS "raeume_insert" ON raeume;
DROP POLICY IF EXISTS "raeume_update" ON raeume;
DROP POLICY IF EXISTS "raeume_delete" ON raeume;

-- Policy: All authenticated users can read rooms
CREATE POLICY "raeume_select"
  ON raeume FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only ADMIN can manage rooms
CREATE POLICY "raeume_insert"
  ON raeume FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "raeume_update"
  ON raeume FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "raeume_delete"
  ON raeume FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS raeume_name_idx ON raeume(name);
CREATE INDEX IF NOT EXISTS raeume_aktiv_idx ON raeume(aktiv);
CREATE INDEX IF NOT EXISTS raeume_typ_idx ON raeume(typ);

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_raeume_updated_at ON raeume;
CREATE TRIGGER update_raeume_updated_at
  BEFORE UPDATE ON raeume
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- TABLE: ressourcen (Equipment/Resources)
-- =============================================================================

CREATE TABLE IF NOT EXISTS ressourcen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  kategorie TEXT CHECK (kategorie IN ('licht', 'ton', 'requisite', 'kostuem', 'buehne', 'sonstiges')),
  menge INTEGER DEFAULT 1,
  beschreibung TEXT,
  aktiv BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE ressourcen ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "ressourcen_select" ON ressourcen;
DROP POLICY IF EXISTS "ressourcen_insert" ON ressourcen;
DROP POLICY IF EXISTS "ressourcen_update" ON ressourcen;
DROP POLICY IF EXISTS "ressourcen_delete" ON ressourcen;

-- Policy: All authenticated users can read resources
CREATE POLICY "ressourcen_select"
  ON ressourcen FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only ADMIN can manage resources
CREATE POLICY "ressourcen_insert"
  ON ressourcen FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "ressourcen_update"
  ON ressourcen FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "ressourcen_delete"
  ON ressourcen FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS ressourcen_name_idx ON ressourcen(name);
CREATE INDEX IF NOT EXISTS ressourcen_aktiv_idx ON ressourcen(aktiv);
CREATE INDEX IF NOT EXISTS ressourcen_kategorie_idx ON ressourcen(kategorie);

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_ressourcen_updated_at ON ressourcen;
CREATE TRIGGER update_ressourcen_updated_at
  BEFORE UPDATE ON ressourcen
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
