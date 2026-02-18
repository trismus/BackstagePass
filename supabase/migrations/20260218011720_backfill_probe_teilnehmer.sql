-- Backfill: Auto-invite Teilnehmer for existing Proben that have none
-- Uses the existing auto_invite_probe_teilnehmer() function to invite
-- cast members based on assigned scenes (or full cast if no scenes assigned)

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
