-- Backfill: Auto-invite Teilnehmer for existing Proben that have none
-- Re-creates the function first (may be missing on remote despite migration being marked applied)
-- then runs the backfill for all open proben without teilnehmer

-- Ensure the function exists
CREATE OR REPLACE FUNCTION auto_invite_probe_teilnehmer(probe_uuid uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  probe_record record;
  szene_ids uuid[];
  pid uuid;
  invited_count integer := 0;
BEGIN
  SELECT p.id, p.stueck_id INTO probe_record
  FROM proben p
  WHERE p.id = probe_uuid;

  IF probe_record.id IS NULL THEN
    RETURN 0;
  END IF;

  SELECT array_agg(ps.szene_id) INTO szene_ids
  FROM proben_szenen ps
  WHERE ps.probe_id = probe_uuid;

  IF szene_ids IS NULL OR array_length(szene_ids, 1) = 0 THEN
    FOR pid IN
      SELECT DISTINCT b.person_id
      FROM besetzungen b
      JOIN rollen r ON r.id = b.rolle_id
      WHERE r.stueck_id = probe_record.stueck_id
        AND b.person_id IS NOT NULL
    LOOP
      IF NOT EXISTS (
        SELECT 1 FROM proben_teilnehmer
        WHERE probe_id = probe_uuid AND person_id = pid
      ) THEN
        INSERT INTO proben_teilnehmer (probe_id, person_id, status)
        VALUES (probe_uuid, pid, 'eingeladen');
        invited_count := invited_count + 1;
      END IF;
    END LOOP;
  ELSE
    FOR pid IN
      SELECT DISTINCT b.person_id
      FROM besetzungen b
      JOIN rollen r ON r.id = b.rolle_id
      JOIN szenen_rollen sr ON sr.rolle_id = r.id
      WHERE sr.szene_id = ANY(szene_ids)
        AND b.person_id IS NOT NULL
    LOOP
      IF NOT EXISTS (
        SELECT 1 FROM proben_teilnehmer
        WHERE probe_id = probe_uuid AND person_id = pid
      ) THEN
        INSERT INTO proben_teilnehmer (probe_id, person_id, status)
        VALUES (probe_uuid, pid, 'eingeladen');
        invited_count := invited_count + 1;
      END IF;
    END LOOP;
  END IF;

  RETURN invited_count;
END;
$func$;

-- Backfill existing proben
DO $$
DECLARE
  probe_record RECORD;
  invited_count INT;
  total_proben INT := 0;
  total_invited INT := 0;
BEGIN
  FOR probe_record IN
    SELECT p.id, p.titel
    FROM proben p
    LEFT JOIN proben_teilnehmer pt ON pt.probe_id = p.id
    WHERE p.status NOT IN ('abgesagt', 'abgeschlossen')
    GROUP BY p.id, p.titel
    HAVING COUNT(pt.id) = 0
  LOOP
    SELECT auto_invite_probe_teilnehmer(probe_record.id) INTO invited_count;
    total_proben := total_proben + 1;
    total_invited := total_invited + COALESCE(invited_count, 0);
    RAISE NOTICE 'Probe "%": % Teilnehmer eingeladen', probe_record.titel, COALESCE(invited_count, 0);
  END LOOP;

  RAISE NOTICE 'Backfill abgeschlossen: % Proben verarbeitet, % Teilnehmer eingeladen', total_proben, total_invited;
END $$;
