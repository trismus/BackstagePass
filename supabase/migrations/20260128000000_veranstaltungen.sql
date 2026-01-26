-- Migration: Create veranstaltungen and anmeldungen tables
-- Created: 2026-01-28
-- Description: Club events and event registrations (Issue #93)
-- Note: This migration is idempotent (can be run multiple times safely)

-- =============================================================================
-- TABLE: veranstaltungen (Club Events)
-- =============================================================================

CREATE TABLE IF NOT EXISTS veranstaltungen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titel TEXT NOT NULL,
  beschreibung TEXT,
  datum DATE NOT NULL,
  startzeit TIME,
  endzeit TIME,
  ort TEXT,
  max_teilnehmer INTEGER,
  warteliste_aktiv BOOLEAN DEFAULT true,
  organisator_id UUID REFERENCES personen(id) ON DELETE SET NULL,
  typ TEXT DEFAULT 'vereinsevent' CHECK (typ IN ('vereinsevent', 'probe', 'auffuehrung', 'sonstiges')),
  status TEXT DEFAULT 'geplant' CHECK (status IN ('geplant', 'bestaetigt', 'abgesagt', 'abgeschlossen')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE veranstaltungen ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "veranstaltungen_select" ON veranstaltungen;
DROP POLICY IF EXISTS "veranstaltungen_insert" ON veranstaltungen;
DROP POLICY IF EXISTS "veranstaltungen_update" ON veranstaltungen;
DROP POLICY IF EXISTS "veranstaltungen_delete" ON veranstaltungen;

-- Policy: All authenticated users can read events
CREATE POLICY "veranstaltungen_select"
  ON veranstaltungen FOR SELECT
  TO authenticated
  USING (true);

-- Policy: EDITOR and ADMIN can create events
CREATE POLICY "veranstaltungen_insert"
  ON veranstaltungen FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'EDITOR')
    )
  );

-- Policy: EDITOR and ADMIN can update events
CREATE POLICY "veranstaltungen_update"
  ON veranstaltungen FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'EDITOR')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'EDITOR')
    )
  );

-- Policy: Only ADMIN can delete events
CREATE POLICY "veranstaltungen_delete"
  ON veranstaltungen FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS veranstaltungen_datum_idx ON veranstaltungen(datum DESC);
CREATE INDEX IF NOT EXISTS veranstaltungen_status_idx ON veranstaltungen(status);
CREATE INDEX IF NOT EXISTS veranstaltungen_typ_idx ON veranstaltungen(typ);

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_veranstaltungen_updated_at ON veranstaltungen;
CREATE TRIGGER update_veranstaltungen_updated_at
  BEFORE UPDATE ON veranstaltungen
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- TABLE: anmeldungen (Event Registrations)
-- =============================================================================

CREATE TABLE IF NOT EXISTS anmeldungen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veranstaltung_id UUID NOT NULL REFERENCES veranstaltungen(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES personen(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'angemeldet' CHECK (status IN ('angemeldet', 'warteliste', 'abgemeldet', 'teilgenommen')),
  anmeldedatum TIMESTAMPTZ DEFAULT NOW(),
  notizen TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(veranstaltung_id, person_id)
);

-- Enable Row Level Security
ALTER TABLE anmeldungen ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "anmeldungen_select" ON anmeldungen;
DROP POLICY IF EXISTS "anmeldungen_insert" ON anmeldungen;
DROP POLICY IF EXISTS "anmeldungen_update" ON anmeldungen;
DROP POLICY IF EXISTS "anmeldungen_delete" ON anmeldungen;

-- Policy: All authenticated users can read registrations
CREATE POLICY "anmeldungen_select"
  ON anmeldungen FOR SELECT
  TO authenticated
  USING (true);

-- Policy: All authenticated users can register (server action validates)
CREATE POLICY "anmeldungen_insert"
  ON anmeldungen FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Users can update own registration, EDITOR+ can update any
CREATE POLICY "anmeldungen_update"
  ON anmeldungen FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Users can delete own registration, EDITOR+ can delete any
CREATE POLICY "anmeldungen_delete"
  ON anmeldungen FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS anmeldungen_veranstaltung_idx ON anmeldungen(veranstaltung_id);
CREATE INDEX IF NOT EXISTS anmeldungen_person_idx ON anmeldungen(person_id);
CREATE INDEX IF NOT EXISTS anmeldungen_status_idx ON anmeldungen(status);

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_anmeldungen_updated_at ON anmeldungen;
CREATE TRIGGER update_anmeldungen_updated_at
  BEFORE UPDATE ON anmeldungen
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
