-- =============================================================================
-- Migration: Simplify get_helfer_dashboard_data — remove System A merge
-- Created: 2026-06-25
-- Issue: #471
-- Description:
--   System A (helferliste) is frozen and contains no active future entries.
--   This migration removes the System-A query (helfer_anmeldungen) from the
--   get_helfer_dashboard_data RPC. The response now contains only `helper` and
--   `zuweisungen` (System B); the previous `anmeldungen` key is dropped. The
--   TypeScript caller in `lib/actions/helfer-dashboard.ts` was updated in the
--   same change.
-- =============================================================================

CREATE OR REPLACE FUNCTION get_helfer_dashboard_data(p_dashboard_token UUID)
RETURNS JSONB AS $$
DECLARE
  v_helper RECORD;
  v_zuweisungen JSONB;
BEGIN
  -- Validate token and get helper info
  SELECT id, vorname, nachname, email, telefon
  INTO v_helper
  FROM externe_helfer_profile
  WHERE dashboard_token = p_dashboard_token;

  IF v_helper IS NULL THEN
    RETURN jsonb_build_object('error', 'invalid');
  END IF;

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
      'email', v_helper.email,
      'telefon', v_helper.telefon
    ),
    'zuweisungen', v_zuweisungen
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
