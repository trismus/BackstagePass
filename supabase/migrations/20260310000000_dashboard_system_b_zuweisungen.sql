-- =============================================================================
-- Migration: Dashboard System B Zuweisungen
-- Created: 2026-03-10
-- Issue: #433
-- Description: Extend get_helfer_dashboard_data RPC to also return
--   auffuehrung_zuweisungen (System B) for external helpers.
--   The result now includes a 'zuweisungen' array alongside 'anmeldungen'.
-- =============================================================================

CREATE OR REPLACE FUNCTION get_helfer_dashboard_data(p_dashboard_token UUID)
RETURNS JSONB AS $$
DECLARE
  v_helper RECORD;
  v_anmeldungen JSONB;
  v_zuweisungen JSONB;
BEGIN
  -- Validate token and get helper info
  SELECT id, vorname, nachname, email
  INTO v_helper
  FROM externe_helfer_profile
  WHERE dashboard_token = p_dashboard_token;

  IF v_helper IS NULL THEN
    RETURN jsonb_build_object('error', 'invalid');
  END IF;

  -- System A: Get all non-rejected helfer_anmeldungen with event and role details
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', ha.id,
      'status', ha.status,
      'abmeldung_token', ha.abmeldung_token,
      'created_at', ha.created_at,
      'rolle_name', COALESCE(hrt.name, hri.custom_name, 'Unbekannte Rolle'),
      'zeitblock_start', hri.zeitblock_start,
      'zeitblock_end', hri.zeitblock_end,
      'rollen_instanz_id', hri.id,
      'event_id', he.id,
      'event_name', he.name,
      'event_datum_start', he.datum_start,
      'event_datum_end', he.datum_end,
      'event_ort', he.ort,
      'event_public_token', he.public_token,
      'event_abmeldung_frist', he.abmeldung_frist
    ) ORDER BY he.datum_start ASC, hri.zeitblock_start ASC NULLS LAST
  ), '[]'::jsonb)
  INTO v_anmeldungen
  FROM helfer_anmeldungen ha
  JOIN helfer_rollen_instanzen hri ON hri.id = ha.rollen_instanz_id
  JOIN helfer_events he ON he.id = hri.helfer_event_id
  LEFT JOIN helfer_rollen_templates hrt ON hrt.id = hri.template_id
  WHERE ha.external_helper_id = v_helper.id
    AND ha.status != 'abgelehnt';

  -- System B: Get all non-cancelled auffuehrung_zuweisungen
  SELECT COALESCE(jsonb_agg(
    jsonb_build_object(
      'id', az.id,
      'status', az.status,
      'abmeldung_token', az.abmeldung_token,
      'created_at', az.created_at,
      'rolle', asc2.rolle,
      'schicht_id', asc2.id,
      'zeitblock_id', zb.id,
      'zeitblock_name', zb.name,
      'zeitblock_start', zb.startzeit,
      'zeitblock_end', zb.endzeit,
      'veranstaltung_id', v.id,
      'veranstaltung_titel', v.titel,
      'veranstaltung_datum', v.datum,
      'veranstaltung_startzeit', v.startzeit,
      'veranstaltung_ort', v.ort,
      'veranstaltung_public_helfer_token', v.public_helfer_token,
      'veranstaltung_helfer_buchung_deadline', v.helfer_buchung_deadline
    ) ORDER BY v.datum ASC, zb.startzeit ASC NULLS LAST
  ), '[]'::jsonb)
  INTO v_zuweisungen
  FROM auffuehrung_zuweisungen az
  JOIN auffuehrung_schichten asc2 ON asc2.id = az.schicht_id
  JOIN veranstaltungen v ON v.id = asc2.veranstaltung_id
  LEFT JOIN zeitbloecke zb ON zb.id = asc2.zeitblock_id
  WHERE az.external_helper_id = v_helper.id
    AND az.status NOT IN ('abgesagt', 'nicht_erschienen');

  RETURN jsonb_build_object(
    'helper', jsonb_build_object(
      'vorname', v_helper.vorname,
      'nachname', v_helper.nachname,
      'email', v_helper.email
    ),
    'anmeldungen', v_anmeldungen,
    'zuweisungen', v_zuweisungen
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
