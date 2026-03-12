-- =============================================================================
-- check_person_conflicts()
-- Cross-system conflict detection for shift assignments
-- Checks 5 sources: verfuegbarkeiten, zuweisungen, anmeldungen, proben, helfer
-- =============================================================================

CREATE OR REPLACE FUNCTION check_person_conflicts(
  p_person_id UUID,
  p_start_zeit TIMESTAMPTZ,
  p_end_zeit TIMESTAMPTZ
) RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_conflicts JSONB := '[]'::JSONB;
  v_record RECORD;
  v_profile_id UUID;
BEGIN
  -- Get the profile_id for this person (needed for helfer_anmeldungen)
  SELECT profile_id INTO v_profile_id
  FROM personen
  WHERE id = p_person_id;

  -- 1. Verfuegbarkeiten (availability blocks)
  FOR v_record IN
    SELECT
      v.id,
      v.status::TEXT AS severity,
      COALESCE(v.grund, v.status::TEXT) AS description,
      CASE
        WHEN v.zeitfenster_von IS NOT NULL THEN
          ((v.datum_von + v.zeitfenster_von) AT TIME ZONE 'Europe/Zurich')::TEXT
        ELSE
          (v.datum_von AT TIME ZONE 'Europe/Zurich')::TEXT
      END AS start_time,
      CASE
        WHEN v.zeitfenster_bis IS NOT NULL THEN
          ((v.datum_bis + v.zeitfenster_bis) AT TIME ZONE 'Europe/Zurich')::TEXT
        ELSE
          ((v.datum_bis + INTERVAL '1 day') AT TIME ZONE 'Europe/Zurich')::TEXT
      END AS end_time
    FROM verfuegbarkeiten v
    WHERE v.mitglied_id = p_person_id
      AND v.status IN ('nicht_verfuegbar', 'eingeschraenkt')
      AND v.datum_von <= (p_end_zeit AT TIME ZONE 'Europe/Zurich')::DATE
      AND v.datum_bis >= (p_start_zeit AT TIME ZONE 'Europe/Zurich')::DATE
      AND (
        v.zeitfenster_von IS NULL
        OR (
          v.zeitfenster_von < (p_end_zeit AT TIME ZONE 'Europe/Zurich')::TIME
          AND v.zeitfenster_bis > (p_start_zeit AT TIME ZONE 'Europe/Zurich')::TIME
        )
      )
  LOOP
    v_conflicts := v_conflicts || jsonb_build_object(
      'type', 'verfuegbarkeit',
      'description', v_record.description,
      'start_time', v_record.start_time,
      'end_time', v_record.end_time,
      'reference_id', v_record.id,
      'severity', v_record.severity
    );
  END LOOP;

  -- 2. Auffuehrung-Zuweisungen (existing shift assignments)
  FOR v_record IN
    SELECT
      az.id,
      s.rolle AS description,
      ((ve.datum + zb.startzeit) AT TIME ZONE 'Europe/Zurich')::TEXT AS start_time,
      ((ve.datum + zb.endzeit) AT TIME ZONE 'Europe/Zurich')::TEXT AS end_time
    FROM auffuehrung_zuweisungen az
    JOIN auffuehrung_schichten s ON s.id = az.schicht_id
    JOIN zeitbloecke zb ON zb.id = s.zeitblock_id
    JOIN veranstaltungen ve ON ve.id = s.veranstaltung_id
    WHERE az.person_id = p_person_id
      AND az.status != 'abgesagt'
      AND ve.status != 'abgesagt'
      AND ((ve.datum + zb.startzeit) AT TIME ZONE 'Europe/Zurich') < p_end_zeit
      AND ((ve.datum + zb.endzeit) AT TIME ZONE 'Europe/Zurich') > p_start_zeit
  LOOP
    v_conflicts := v_conflicts || jsonb_build_object(
      'type', 'zuweisung',
      'description', v_record.description,
      'start_time', v_record.start_time,
      'end_time', v_record.end_time,
      'reference_id', v_record.id
    );
  END LOOP;

  -- 3. Anmeldungen (event registrations)
  FOR v_record IN
    SELECT
      a.id,
      ve.titel AS description,
      ((ve.datum + ve.startzeit) AT TIME ZONE 'Europe/Zurich')::TEXT AS start_time,
      ((ve.datum + ve.endzeit) AT TIME ZONE 'Europe/Zurich')::TEXT AS end_time
    FROM anmeldungen a
    JOIN veranstaltungen ve ON ve.id = a.veranstaltung_id
    WHERE a.person_id = p_person_id
      AND a.status != 'abgemeldet'
      AND ve.status != 'abgesagt'
      AND ve.startzeit IS NOT NULL
      AND ve.endzeit IS NOT NULL
      AND ((ve.datum + ve.startzeit) AT TIME ZONE 'Europe/Zurich') < p_end_zeit
      AND ((ve.datum + ve.endzeit) AT TIME ZONE 'Europe/Zurich') > p_start_zeit
  LOOP
    v_conflicts := v_conflicts || jsonb_build_object(
      'type', 'anmeldung',
      'description', v_record.description,
      'start_time', v_record.start_time,
      'end_time', v_record.end_time,
      'reference_id', v_record.id
    );
  END LOOP;

  -- 4. Proben (rehearsals)
  FOR v_record IN
    SELECT
      pt.id,
      p.titel AS description,
      ((p.datum + p.startzeit) AT TIME ZONE 'Europe/Zurich')::TEXT AS start_time,
      ((p.datum + p.endzeit) AT TIME ZONE 'Europe/Zurich')::TEXT AS end_time
    FROM proben_teilnehmer pt
    JOIN proben p ON p.id = pt.probe_id
    WHERE pt.person_id = p_person_id
      AND pt.status != 'abgesagt'
      AND p.status != 'abgesagt'
      AND p.startzeit IS NOT NULL
      AND p.endzeit IS NOT NULL
      AND ((p.datum + p.startzeit) AT TIME ZONE 'Europe/Zurich') < p_end_zeit
      AND ((p.datum + p.endzeit) AT TIME ZONE 'Europe/Zurich') > p_start_zeit
  LOOP
    v_conflicts := v_conflicts || jsonb_build_object(
      'type', 'probe',
      'description', v_record.description,
      'start_time', v_record.start_time,
      'end_time', v_record.end_time,
      'reference_id', v_record.id
    );
  END LOOP;

  -- 5. Helfer-Anmeldungen (helper registrations via profile_id)
  IF v_profile_id IS NOT NULL THEN
    FOR v_record IN
      SELECT
        ha.id,
        COALESCE(hrt.name, hri.custom_name, he.name) AS description,
        COALESCE(hri.zeitblock_start, he.datum_start)::TEXT AS start_time,
        COALESCE(hri.zeitblock_end, he.datum_end)::TEXT AS end_time
      FROM helfer_anmeldungen ha
      JOIN helfer_rollen_instanzen hri ON hri.id = ha.rollen_instanz_id
      JOIN helfer_events he ON he.id = hri.helfer_event_id
      LEFT JOIN helfer_rollen_templates hrt ON hrt.id = hri.template_id
      WHERE ha.profile_id = v_profile_id
        AND ha.status != 'abgelehnt'
        AND COALESCE(hri.zeitblock_start, he.datum_start) < p_end_zeit
        AND COALESCE(hri.zeitblock_end, he.datum_end) > p_start_zeit
    LOOP
      v_conflicts := v_conflicts || jsonb_build_object(
        'type', 'helfer',
        'description', v_record.description,
        'start_time', v_record.start_time,
        'end_time', v_record.end_time,
        'reference_id', v_record.id
      );
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'has_conflicts', jsonb_array_length(v_conflicts) > 0,
    'conflicts', v_conflicts
  );
END;
$$;

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION check_person_conflicts(UUID, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
