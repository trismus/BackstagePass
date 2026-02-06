-- Migration: Enhance ressourcen_reservierungen with bedarf fields
-- Issue #173: Ressourcenbedarf pro Auffuehrung

-- =============================================================================
-- Add status and fix_variabel columns to ressourcen_reservierungen
-- =============================================================================

-- Create enum for reservierung status
DO $$
BEGIN
  CREATE TYPE reservierung_status AS ENUM ('geplant', 'reserviert', 'bestaetigt');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create enum for fix/variabel
DO $$
BEGIN
  CREATE TYPE bedarf_typ AS ENUM ('fix', 'variabel');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add new columns to ressourcen_reservierungen
ALTER TABLE ressourcen_reservierungen
ADD COLUMN IF NOT EXISTS status reservierung_status DEFAULT 'geplant',
ADD COLUMN IF NOT EXISTS bedarf_typ bedarf_typ DEFAULT 'fix';

-- Same for raum_reservierungen
ALTER TABLE raum_reservierungen
ADD COLUMN IF NOT EXISTS status reservierung_status DEFAULT 'geplant';

-- =============================================================================
-- Create template_ressourcen for series-level defaults
-- =============================================================================

-- Note: template_ressourcen already exists in types, but may not have migration
-- This will add columns if they don't exist

CREATE TABLE IF NOT EXISTS template_ressourcen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES auffuehrung_templates(id) ON DELETE CASCADE,
  ressource_id UUID REFERENCES ressourcen(id) ON DELETE SET NULL,
  menge INTEGER DEFAULT 1,
  bedarf_typ bedarf_typ DEFAULT 'fix',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- Serie-level ressourcen defaults
-- =============================================================================

CREATE TABLE IF NOT EXISTS serie_ressourcen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serie_id UUID NOT NULL REFERENCES auffuehrungsserien(id) ON DELETE CASCADE,
  ressource_id UUID REFERENCES ressourcen(id) ON DELETE SET NULL,
  menge INTEGER DEFAULT 1,
  bedarf_typ bedarf_typ DEFAULT 'fix',
  notizen TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(serie_id, ressource_id)
);

-- Enable RLS
ALTER TABLE serie_ressourcen ENABLE ROW LEVEL SECURITY;

-- RLS Policies for serie_ressourcen
CREATE POLICY "Authenticated can view serie_ressourcen"
  ON serie_ressourcen FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Management can manage serie_ressourcen"
  ON serie_ressourcen FOR ALL
  TO authenticated
  USING (is_management())
  WITH CHECK (is_management());

-- =============================================================================
-- Function to check for resource conflicts
-- =============================================================================

CREATE OR REPLACE FUNCTION check_ressource_konflikt(
  p_ressource_id UUID,
  p_veranstaltung_id UUID
)
RETURNS TABLE (
  konflikt_veranstaltung_id UUID,
  konflikt_titel TEXT,
  konflikt_datum DATE,
  reserviert_menge INTEGER
) AS $$
DECLARE
  v_datum DATE;
  v_verfuegbare_menge INTEGER;
BEGIN
  -- Get the date of the target veranstaltung
  SELECT datum INTO v_datum
  FROM veranstaltungen
  WHERE id = p_veranstaltung_id;

  -- Get the total available quantity for this resource
  SELECT menge INTO v_verfuegbare_menge
  FROM ressourcen
  WHERE id = p_ressource_id;

  -- Find all other reservations on the same date
  RETURN QUERY
  SELECT
    rr.veranstaltung_id,
    v.titel,
    v.datum,
    rr.menge
  FROM ressourcen_reservierungen rr
  JOIN veranstaltungen v ON v.id = rr.veranstaltung_id
  WHERE rr.ressource_id = p_ressource_id
    AND v.datum = v_datum
    AND rr.veranstaltung_id != p_veranstaltung_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- =============================================================================
-- Function to copy serie defaults to a new veranstaltung
-- =============================================================================

CREATE OR REPLACE FUNCTION copy_serie_ressourcen_to_veranstaltung(
  p_serie_id UUID,
  p_veranstaltung_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
BEGIN
  -- Insert ressourcen from serie defaults
  INSERT INTO ressourcen_reservierungen (veranstaltung_id, ressource_id, menge, bedarf_typ, status)
  SELECT
    p_veranstaltung_id,
    sr.ressource_id,
    sr.menge,
    sr.bedarf_typ,
    'geplant'::reservierung_status
  FROM serie_ressourcen sr
  WHERE sr.serie_id = p_serie_id
    AND sr.ressource_id IS NOT NULL
  ON CONFLICT (veranstaltung_id, ressource_id) DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Indexes
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_ressourcen_reservierungen_status
  ON ressourcen_reservierungen(status);
CREATE INDEX IF NOT EXISTS idx_serie_ressourcen_serie
  ON serie_ressourcen(serie_id);

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON TABLE serie_ressourcen IS 'Default resource requirements per series';
COMMENT ON COLUMN ressourcen_reservierungen.status IS 'Reservation status: geplant, reserviert, bestaetigt';
COMMENT ON COLUMN ressourcen_reservierungen.bedarf_typ IS 'Whether resource is always needed (fix) or optional (variabel)';
COMMENT ON FUNCTION check_ressource_konflikt IS 'Check for resource conflicts on the same date';
COMMENT ON FUNCTION copy_serie_ressourcen_to_veranstaltung IS 'Copy default resources from serie to a new veranstaltung';
