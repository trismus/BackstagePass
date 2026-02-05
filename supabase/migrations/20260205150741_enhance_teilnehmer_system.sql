-- Issue #165: Einladungs- und Teilnahme-System Enhancement
-- Adds "vielleicht" status and absage_grund field to proben_teilnehmer

-- Add absage_grund column to proben_teilnehmer
ALTER TABLE proben_teilnehmer
ADD COLUMN IF NOT EXISTS absage_grund text;

-- Add comment for documentation
COMMENT ON COLUMN proben_teilnehmer.absage_grund IS 'Grund für Absage oder Vielleicht-Status';

-- Update the status enum constraint to include 'vielleicht'
-- First, drop existing constraint if it exists
ALTER TABLE proben_teilnehmer DROP CONSTRAINT IF EXISTS proben_teilnehmer_status_check;

-- Create new constraint with 'vielleicht' included
-- Note: PostgreSQL enums are handled differently, so we use CHECK constraint
ALTER TABLE proben_teilnehmer ADD CONSTRAINT proben_teilnehmer_status_check
CHECK (status IN ('eingeladen', 'zugesagt', 'abgesagt', 'vielleicht', 'erschienen', 'nicht_erschienen'));

-- Also add absage_grund to anmeldungen table for veranstaltungen
ALTER TABLE anmeldungen
ADD COLUMN IF NOT EXISTS absage_grund text;

COMMENT ON COLUMN anmeldungen.absage_grund IS 'Grund für Absage';

-- Create or replace function to auto-invite participants when probe is created
-- This function is called via trigger or can be called manually
CREATE OR REPLACE FUNCTION auto_invite_probe_teilnehmer(probe_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  probe_record record;
  szene_ids uuid[];
  person_id uuid;
  invited_count integer := 0;
BEGIN
  -- Get probe details
  SELECT p.id, p.stueck_id INTO probe_record
  FROM proben p
  WHERE p.id = probe_uuid;

  IF probe_record.id IS NULL THEN
    RETURN 0;
  END IF;

  -- Get szenen IDs for this probe
  SELECT array_agg(ps.szene_id) INTO szene_ids
  FROM proben_szenen ps
  WHERE ps.probe_id = probe_uuid;

  -- If no szenen, get all roles from the stueck
  IF szene_ids IS NULL OR array_length(szene_ids, 1) = 0 THEN
    -- Invite all cast members of the stueck
    FOR person_id IN
      SELECT DISTINCT b.person_id
      FROM besetzungen b
      JOIN rollen r ON r.id = b.rolle_id
      WHERE r.stueck_id = probe_record.stueck_id
        AND b.person_id IS NOT NULL
    LOOP
      -- Check if not already invited
      IF NOT EXISTS (
        SELECT 1 FROM proben_teilnehmer
        WHERE probe_id = probe_uuid AND person_id = person_id
      ) THEN
        INSERT INTO proben_teilnehmer (probe_id, person_id, status)
        VALUES (probe_uuid, person_id, 'eingeladen');
        invited_count := invited_count + 1;
      END IF;
    END LOOP;
  ELSE
    -- Invite cast members for the specific szenen
    FOR person_id IN
      SELECT DISTINCT b.person_id
      FROM besetzungen b
      JOIN rollen r ON r.id = b.rolle_id
      JOIN szenen_rollen sr ON sr.rolle_id = r.id
      WHERE sr.szene_id = ANY(szene_ids)
        AND b.person_id IS NOT NULL
    LOOP
      IF NOT EXISTS (
        SELECT 1 FROM proben_teilnehmer
        WHERE probe_id = probe_uuid AND person_id = person_id
      ) THEN
        INSERT INTO proben_teilnehmer (probe_id, person_id, status)
        VALUES (probe_uuid, person_id, 'eingeladen');
        invited_count := invited_count + 1;
      END IF;
    END LOOP;
  END IF;

  RETURN invited_count;
END;
$$;

-- Create view for probe attendance overview
CREATE OR REPLACE VIEW probe_teilnehmer_uebersicht AS
SELECT
  p.id as probe_id,
  p.titel as probe_titel,
  p.datum,
  p.startzeit,
  p.stueck_id,
  s.titel as stueck_titel,
  COUNT(DISTINCT pt.id) as total_eingeladen,
  COUNT(DISTINCT CASE WHEN pt.status = 'zugesagt' THEN pt.id END) as anzahl_zugesagt,
  COUNT(DISTINCT CASE WHEN pt.status = 'vielleicht' THEN pt.id END) as anzahl_vielleicht,
  COUNT(DISTINCT CASE WHEN pt.status = 'abgesagt' THEN pt.id END) as anzahl_abgesagt,
  COUNT(DISTINCT CASE WHEN pt.status = 'eingeladen' THEN pt.id END) as anzahl_offen,
  COUNT(DISTINCT CASE WHEN pt.status = 'erschienen' THEN pt.id END) as anzahl_erschienen,
  COUNT(DISTINCT CASE WHEN pt.status = 'nicht_erschienen' THEN pt.id END) as anzahl_nicht_erschienen
FROM proben p
LEFT JOIN stuecke s ON s.id = p.stueck_id
LEFT JOIN proben_teilnehmer pt ON pt.probe_id = p.id
GROUP BY p.id, p.titel, p.datum, p.startzeit, p.stueck_id, s.titel
ORDER BY p.datum DESC;

-- Grant access to authenticated users
GRANT SELECT ON probe_teilnehmer_uebersicht TO authenticated;
