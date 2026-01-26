-- Migration: Create stundenkonto table
-- Created: 2026-01-30
-- Description: Hours ledger for tracking member contributions (Issue #95)
-- Note: This migration is idempotent (can be run multiple times safely)

-- =============================================================================
-- TABLE: stundenkonto (Hours Ledger)
-- =============================================================================

CREATE TABLE IF NOT EXISTS stundenkonto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID NOT NULL REFERENCES personen(id) ON DELETE CASCADE,
  typ TEXT NOT NULL CHECK (typ IN ('helfereinsatz', 'vereinsevent', 'sonstiges', 'korrektur')),
  referenz_id UUID,
  stunden DECIMAL(5,2) NOT NULL,
  beschreibung TEXT,
  erfasst_von UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE stundenkonto ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "stundenkonto_select_own" ON stundenkonto;
DROP POLICY IF EXISTS "stundenkonto_select_admin" ON stundenkonto;
DROP POLICY IF EXISTS "stundenkonto_insert" ON stundenkonto;
DROP POLICY IF EXISTS "stundenkonto_update" ON stundenkonto;
DROP POLICY IF EXISTS "stundenkonto_delete" ON stundenkonto;

-- Policy: Users can read their own hours (via linked person)
-- Note: This requires linking auth.users to personen via email
CREATE POLICY "stundenkonto_select_own"
  ON stundenkonto FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM personen p
      JOIN profiles pr ON pr.email = p.email
      WHERE p.id = stundenkonto.person_id AND pr.id = auth.uid()
    )
  );

-- Policy: ADMIN and EDITOR can read all hours
CREATE POLICY "stundenkonto_select_admin"
  ON stundenkonto FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'EDITOR')
    )
  );

-- Policy: EDITOR and ADMIN can insert hours
CREATE POLICY "stundenkonto_insert"
  ON stundenkonto FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'EDITOR')
    )
  );

-- Policy: Only ADMIN can update hours (corrections)
CREATE POLICY "stundenkonto_update"
  ON stundenkonto FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Policy: Only ADMIN can delete hours
CREATE POLICY "stundenkonto_delete"
  ON stundenkonto FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS stundenkonto_person_idx ON stundenkonto(person_id);
CREATE INDEX IF NOT EXISTS stundenkonto_typ_idx ON stundenkonto(typ);
CREATE INDEX IF NOT EXISTS stundenkonto_created_idx ON stundenkonto(created_at DESC);
CREATE INDEX IF NOT EXISTS stundenkonto_referenz_idx ON stundenkonto(referenz_id);

-- =============================================================================
-- FUNCTION: Calculate total hours for a person
-- =============================================================================

CREATE OR REPLACE FUNCTION get_stundensaldo(p_person_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  saldo DECIMAL;
BEGIN
  SELECT COALESCE(SUM(stunden), 0) INTO saldo
  FROM stundenkonto
  WHERE person_id = p_person_id;
  RETURN saldo;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
