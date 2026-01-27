-- Migration: Verfügbarkeiten-System (Issue #4)
-- Tracks member availability and absences

-- ============================================================================
-- Verfügbarkeiten Table
-- ============================================================================

CREATE TYPE verfuegbarkeit_status AS ENUM (
  'verfuegbar',
  'eingeschraenkt',
  'nicht_verfuegbar'
);

CREATE TYPE wiederholung_typ AS ENUM (
  'keine',
  'woechentlich',
  'monatlich'
);

CREATE TABLE IF NOT EXISTS verfuegbarkeiten (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mitglied_id UUID NOT NULL REFERENCES personen(id) ON DELETE CASCADE,

  -- Time period
  datum_von DATE NOT NULL,
  datum_bis DATE NOT NULL,
  zeitfenster_von TIME,  -- NULL means whole day
  zeitfenster_bis TIME,

  -- Status and type
  status verfuegbarkeit_status NOT NULL DEFAULT 'nicht_verfuegbar',
  wiederholung wiederholung_typ NOT NULL DEFAULT 'keine',

  -- Optional info
  grund TEXT,  -- Reason: Urlaub, Arbeit, Privat, etc.
  notiz TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Ensure datum_von <= datum_bis
  CONSTRAINT valid_date_range CHECK (datum_von <= datum_bis),
  -- Ensure time range is valid if both are set
  CONSTRAINT valid_time_range CHECK (
    zeitfenster_von IS NULL OR zeitfenster_bis IS NULL
    OR zeitfenster_von < zeitfenster_bis
  )
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_verfuegbarkeiten_mitglied ON verfuegbarkeiten(mitglied_id);
CREATE INDEX IF NOT EXISTS idx_verfuegbarkeiten_datum ON verfuegbarkeiten(datum_von, datum_bis);
CREATE INDEX IF NOT EXISTS idx_verfuegbarkeiten_status ON verfuegbarkeiten(status);

-- ============================================================================
-- Trigger for updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_verfuegbarkeiten_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER verfuegbarkeiten_updated_at
  BEFORE UPDATE ON verfuegbarkeiten
  FOR EACH ROW
  EXECUTE FUNCTION update_verfuegbarkeiten_updated_at();

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE verfuegbarkeiten ENABLE ROW LEVEL SECURITY;

-- Members can view and edit their own availability
CREATE POLICY verfuegbarkeiten_own ON verfuegbarkeiten
  FOR ALL TO authenticated
  USING (
    mitglied_id IN (
      SELECT id FROM personen WHERE email = (
        SELECT email FROM auth.users WHERE id = auth.uid()
      )
    )
  );

-- Management can view all availabilities
CREATE POLICY verfuegbarkeiten_management_select ON verfuegbarkeiten
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('ADMIN', 'VORSTAND')
    )
  );

-- Management can modify all availabilities
CREATE POLICY verfuegbarkeiten_management_modify ON verfuegbarkeiten
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('ADMIN', 'VORSTAND')
    )
  );

-- ============================================================================
-- Helper function to check availability for a date
-- ============================================================================

CREATE OR REPLACE FUNCTION check_member_availability(
  p_mitglied_id UUID,
  p_datum DATE,
  p_zeit_von TIME DEFAULT NULL,
  p_zeit_bis TIME DEFAULT NULL
) RETURNS verfuegbarkeit_status AS $$
DECLARE
  v_status verfuegbarkeit_status;
BEGIN
  -- Check for any non-available entries on this date
  SELECT status INTO v_status
  FROM verfuegbarkeiten
  WHERE mitglied_id = p_mitglied_id
    AND p_datum BETWEEN datum_von AND datum_bis
    AND (
      -- Check time overlap if times are specified
      zeitfenster_von IS NULL
      OR zeitfenster_bis IS NULL
      OR (p_zeit_von IS NULL AND p_zeit_bis IS NULL)
      OR (
        (p_zeit_von IS NULL OR p_zeit_von < zeitfenster_bis) AND
        (p_zeit_bis IS NULL OR p_zeit_bis > zeitfenster_von)
      )
    )
  ORDER BY
    CASE status
      WHEN 'nicht_verfuegbar' THEN 1
      WHEN 'eingeschraenkt' THEN 2
      WHEN 'verfuegbar' THEN 3
    END
  LIMIT 1;

  -- If no entry found, assume available
  IF v_status IS NULL THEN
    RETURN 'verfuegbar';
  END IF;

  RETURN v_status;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE verfuegbarkeiten IS 'Member availability and absence tracking';
COMMENT ON COLUMN verfuegbarkeiten.zeitfenster_von IS 'Start time of unavailability. NULL means whole day.';
COMMENT ON COLUMN verfuegbarkeiten.zeitfenster_bis IS 'End time of unavailability. NULL means whole day.';
COMMENT ON COLUMN verfuegbarkeiten.wiederholung IS 'Recurring pattern: none, weekly, or monthly';
COMMENT ON COLUMN verfuegbarkeiten.grund IS 'Reason category: Urlaub, Arbeit, Privat, Krankheit, etc.';
