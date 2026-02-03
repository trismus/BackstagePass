-- Migration: Stab-Funktionen & Externe Mitarbeiter (Issue #159)
-- Standardisierte Funktionen für Produktions-Team und Support für externe Mitarbeiter

-- =============================================================================
-- ENUM Types
-- =============================================================================

CREATE TYPE stab_kategorie AS ENUM (
  'kuenstlerisch',
  'technisch',
  'organisation'
);

-- =============================================================================
-- Tables
-- =============================================================================

-- Stab-Funktionen (Lookup-Tabelle für standardisierte Funktionsbezeichnungen)
CREATE TABLE stab_funktionen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  kategorie stab_kategorie NOT NULL,
  sortierung INTEGER NOT NULL DEFAULT 0,
  aktiv BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- Erweitere produktions_stab für externe Mitarbeiter
-- =============================================================================

ALTER TABLE produktions_stab
  ADD COLUMN externer_name TEXT,
  ADD COLUMN externer_kontakt TEXT;

-- Person oder externer Name muss gesetzt sein
-- (person_id ist NOT NULL im Original - wir ändern das zu nullable)
ALTER TABLE produktions_stab
  ALTER COLUMN person_id DROP NOT NULL;

-- Drop und recreate unique constraint um person_id nullable zu unterstützen
ALTER TABLE produktions_stab
  DROP CONSTRAINT IF EXISTS produktions_stab_produktion_id_person_id_funktion_key;

CREATE UNIQUE INDEX idx_produktions_stab_unique
  ON produktions_stab (produktion_id, COALESCE(person_id, '00000000-0000-0000-0000-000000000000'::uuid), funktion);

-- Check: entweder person_id oder externer_name muss gesetzt sein
ALTER TABLE produktions_stab
  ADD CONSTRAINT chk_stab_person_oder_extern
  CHECK (person_id IS NOT NULL OR externer_name IS NOT NULL);

-- =============================================================================
-- Indexes
-- =============================================================================

CREATE INDEX idx_stab_funktionen_kategorie ON stab_funktionen(kategorie);

-- =============================================================================
-- Row Level Security
-- =============================================================================

ALTER TABLE stab_funktionen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view stab_funktionen"
  ON stab_funktionen FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Management can manage stab_funktionen"
  ON stab_funktionen FOR ALL
  TO authenticated
  USING (is_management())
  WITH CHECK (is_management());

-- =============================================================================
-- Seed Data
-- =============================================================================

INSERT INTO stab_funktionen (name, kategorie, sortierung) VALUES
  -- Künstlerisch
  ('Regie', 'kuenstlerisch', 10),
  ('Co-Regie', 'kuenstlerisch', 11),
  ('Regieassistenz', 'kuenstlerisch', 12),
  ('Musikalische Leitung', 'kuenstlerisch', 20),
  ('Choreografie', 'kuenstlerisch', 30),
  ('Dramaturgie', 'kuenstlerisch', 40),
  -- Technisch
  ('Technische Leitung', 'technisch', 100),
  ('Bühnenbild', 'technisch', 110),
  ('Licht', 'technisch', 120),
  ('Ton', 'technisch', 130),
  ('Maske', 'technisch', 140),
  ('Kostüm', 'technisch', 150),
  ('Requisite', 'technisch', 160),
  -- Organisation
  ('Produktionsleitung', 'organisation', 200),
  ('Aufnahmeleitung', 'organisation', 210),
  ('Öffentlichkeitsarbeit', 'organisation', 220),
  ('Ticketing', 'organisation', 230),
  ('Catering', 'organisation', 240);

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON TABLE stab_funktionen IS 'Standardisierte Funktionen für Produktionsteams';
COMMENT ON COLUMN produktions_stab.externer_name IS 'Name eines externen Mitarbeiters (ohne Mitgliederprofil)';
COMMENT ON COLUMN produktions_stab.externer_kontakt IS 'Kontaktinfo des externen Mitarbeiters (E-Mail/Telefon)';
