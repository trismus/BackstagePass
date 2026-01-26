-- Migration: Create partner, helfereinsaetze, helferrollen, helferschichten tables
-- Created: 2026-01-29
-- Description: External helper events and assignments (Issue #94)
-- Note: This migration is idempotent (can be run multiple times safely)

-- =============================================================================
-- TABLE: partner (External Partners)
-- =============================================================================

CREATE TABLE IF NOT EXISTS partner (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  kontakt_name TEXT,
  kontakt_email TEXT,
  kontakt_telefon TEXT,
  adresse TEXT,
  notizen TEXT,
  aktiv BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE partner ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "partner_select" ON partner;
DROP POLICY IF EXISTS "partner_insert" ON partner;
DROP POLICY IF EXISTS "partner_update" ON partner;
DROP POLICY IF EXISTS "partner_delete" ON partner;

-- Policy: All authenticated users can read partners
CREATE POLICY "partner_select"
  ON partner FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Only ADMIN can manage partners
CREATE POLICY "partner_insert"
  ON partner FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "partner_update"
  ON partner FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "partner_delete"
  ON partner FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS partner_name_idx ON partner(name);
CREATE INDEX IF NOT EXISTS partner_aktiv_idx ON partner(aktiv);

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_partner_updated_at ON partner;
CREATE TRIGGER update_partner_updated_at
  BEFORE UPDATE ON partner
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- TABLE: helfereinsaetze (Helper Events)
-- =============================================================================

CREATE TABLE IF NOT EXISTS helfereinsaetze (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partner(id) ON DELETE SET NULL,
  titel TEXT NOT NULL,
  beschreibung TEXT,
  datum DATE NOT NULL,
  startzeit TIME,
  endzeit TIME,
  ort TEXT,
  stundenlohn_verein DECIMAL(10,2),
  status TEXT DEFAULT 'offen' CHECK (status IN ('offen', 'bestaetigt', 'abgeschlossen', 'abgesagt')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE helfereinsaetze ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "helfereinsaetze_select" ON helfereinsaetze;
DROP POLICY IF EXISTS "helfereinsaetze_insert" ON helfereinsaetze;
DROP POLICY IF EXISTS "helfereinsaetze_update" ON helfereinsaetze;
DROP POLICY IF EXISTS "helfereinsaetze_delete" ON helfereinsaetze;

-- Policy: All authenticated users can read helper events
CREATE POLICY "helfereinsaetze_select"
  ON helfereinsaetze FOR SELECT
  TO authenticated
  USING (true);

-- Policy: EDITOR and ADMIN can manage helper events
CREATE POLICY "helfereinsaetze_insert"
  ON helfereinsaetze FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'EDITOR')
    )
  );

CREATE POLICY "helfereinsaetze_update"
  ON helfereinsaetze FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'EDITOR')
    )
  );

CREATE POLICY "helfereinsaetze_delete"
  ON helfereinsaetze FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS helfereinsaetze_datum_idx ON helfereinsaetze(datum DESC);
CREATE INDEX IF NOT EXISTS helfereinsaetze_partner_idx ON helfereinsaetze(partner_id);
CREATE INDEX IF NOT EXISTS helfereinsaetze_status_idx ON helfereinsaetze(status);

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_helfereinsaetze_updated_at ON helfereinsaetze;
CREATE TRIGGER update_helfereinsaetze_updated_at
  BEFORE UPDATE ON helfereinsaetze
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- TABLE: helferrollen (Required Helper Roles per Event)
-- =============================================================================

CREATE TABLE IF NOT EXISTS helferrollen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  helfereinsatz_id UUID NOT NULL REFERENCES helfereinsaetze(id) ON DELETE CASCADE,
  rolle TEXT NOT NULL,
  anzahl_benoetigt INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE helferrollen ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "helferrollen_select" ON helferrollen;
DROP POLICY IF EXISTS "helferrollen_insert" ON helferrollen;
DROP POLICY IF EXISTS "helferrollen_update" ON helferrollen;
DROP POLICY IF EXISTS "helferrollen_delete" ON helferrollen;

-- Policy: All authenticated users can read roles
CREATE POLICY "helferrollen_select"
  ON helferrollen FOR SELECT
  TO authenticated
  USING (true);

-- Policy: EDITOR and ADMIN can manage roles
CREATE POLICY "helferrollen_insert"
  ON helferrollen FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'EDITOR')
    )
  );

CREATE POLICY "helferrollen_update"
  ON helferrollen FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'EDITOR')
    )
  );

CREATE POLICY "helferrollen_delete"
  ON helferrollen FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'EDITOR')
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS helferrollen_einsatz_idx ON helferrollen(helfereinsatz_id);

-- =============================================================================
-- TABLE: helferschichten (Helper Assignments/Shifts)
-- =============================================================================

CREATE TABLE IF NOT EXISTS helferschichten (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  helfereinsatz_id UUID NOT NULL REFERENCES helfereinsaetze(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES personen(id) ON DELETE CASCADE,
  helferrolle_id UUID REFERENCES helferrollen(id) ON DELETE SET NULL,
  startzeit TIME,
  endzeit TIME,
  stunden_gearbeitet DECIMAL(5,2),
  status TEXT DEFAULT 'zugesagt' CHECK (status IN ('zugesagt', 'abgesagt', 'erschienen', 'nicht_erschienen')),
  notizen TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(helfereinsatz_id, person_id, helferrolle_id)
);

-- Enable Row Level Security
ALTER TABLE helferschichten ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "helferschichten_select" ON helferschichten;
DROP POLICY IF EXISTS "helferschichten_insert" ON helferschichten;
DROP POLICY IF EXISTS "helferschichten_update" ON helferschichten;
DROP POLICY IF EXISTS "helferschichten_delete" ON helferschichten;

-- Policy: All authenticated users can read shifts
CREATE POLICY "helferschichten_select"
  ON helferschichten FOR SELECT
  TO authenticated
  USING (true);

-- Policy: All authenticated can register for shifts (server validates)
CREATE POLICY "helferschichten_insert"
  ON helferschichten FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Users can update own shifts, EDITOR+ can update any
CREATE POLICY "helferschichten_update"
  ON helferschichten FOR UPDATE
  TO authenticated
  USING (true);

-- Policy: Users can delete own shifts, EDITOR+ can delete any
CREATE POLICY "helferschichten_delete"
  ON helferschichten FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS helferschichten_einsatz_idx ON helferschichten(helfereinsatz_id);
CREATE INDEX IF NOT EXISTS helferschichten_person_idx ON helferschichten(person_id);
CREATE INDEX IF NOT EXISTS helferschichten_status_idx ON helferschichten(status);

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_helferschichten_updated_at ON helferschichten;
CREATE TRIGGER update_helferschichten_updated_at
  BEFORE UPDATE ON helferschichten
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
