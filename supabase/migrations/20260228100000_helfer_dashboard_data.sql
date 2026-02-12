-- =============================================================================
-- Migration: Helfer Dashboard Data RPC
-- Created: 2026-02-28
-- Issue: US-9 / #251
-- Description: RPC function for the personal volunteer dashboard.
--   Validates dashboard_token, returns helper info + registration details.
-- =============================================================================

CREATE OR REPLACE FUNCTION get_helfer_dashboard_data(p_dashboard_token UUID)
RETURNS JSONB AS $$
DECLARE
  v_helper RECORD;
  v_anmeldungen JSONB;
BEGIN
  -- Validate token and get helper info
  SELECT id, vorname, nachname, email
  INTO v_helper
  FROM externe_helfer_profile
  WHERE dashboard_token = p_dashboard_token;

  IF v_helper IS NULL THEN
    RETURN jsonb_build_object('error', 'invalid');
  END IF;

  -- Get all non-rejected registrations with event and role details
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

  RETURN jsonb_build_object(
    'helper', jsonb_build_object(
      'vorname', v_helper.vorname,
      'nachname', v_helper.nachname,
      'email', v_helper.email
    ),
    'anmeldungen', v_anmeldungen
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_helfer_dashboard_data TO anon;
GRANT EXECUTE ON FUNCTION get_helfer_dashboard_data TO authenticated;
