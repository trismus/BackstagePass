-- =============================================================================
-- Migration: Helferliste Management Dashboard
-- Creates view and RPC for Vorstand dashboard overview
-- =============================================================================

-- =============================================================================
-- View: v_helfer_event_belegung
-- Aggregates occupancy data per helfer_event for dashboard display
-- Traffic light logic: gruen >= 100%, gelb >= 50%, rot < 50%
-- =============================================================================

CREATE OR REPLACE VIEW v_helfer_event_belegung AS
SELECT
  he.id AS event_id,
  he.name,
  he.typ,
  he.datum_start,
  he.datum_end,
  he.ort,
  he.veranstaltung_id,
  he.public_token,
  COALESCE(SUM(hri.anzahl_benoetigt), 0)::int AS total_benoetigt,
  COALESCE(SUM(
    (SELECT COUNT(*)
     FROM helfer_anmeldungen ha
     WHERE ha.rollen_instanz_id = hri.id
       AND ha.status IN ('angemeldet', 'bestaetigt'))
  ), 0)::int AS total_belegt,
  CASE
    WHEN COALESCE(SUM(hri.anzahl_benoetigt), 0) = 0 THEN 'gruen'
    WHEN COALESCE(SUM(
      (SELECT COUNT(*)
       FROM helfer_anmeldungen ha
       WHERE ha.rollen_instanz_id = hri.id
         AND ha.status IN ('angemeldet', 'bestaetigt'))
    ), 0)::float / NULLIF(SUM(hri.anzahl_benoetigt), 0) >= 1.0 THEN 'gruen'
    WHEN COALESCE(SUM(
      (SELECT COUNT(*)
       FROM helfer_anmeldungen ha
       WHERE ha.rollen_instanz_id = hri.id
         AND ha.status IN ('angemeldet', 'bestaetigt'))
    ), 0)::float / NULLIF(SUM(hri.anzahl_benoetigt), 0) >= 0.5 THEN 'gelb'
    ELSE 'rot'
  END AS ampel,
  COUNT(hri.id)::int AS rollen_count
FROM helfer_events he
LEFT JOIN helfer_rollen_instanzen hri ON hri.helfer_event_id = he.id
GROUP BY he.id, he.name, he.typ, he.datum_start, he.datum_end, he.ort, he.veranstaltung_id, he.public_token;

-- Grant access to authenticated users (RLS on underlying tables still applies)
GRANT SELECT ON v_helfer_event_belegung TO authenticated;

-- =============================================================================
-- RPC: get_helferliste_dashboard_data()
-- Returns future events with occupancy data for management dashboard
-- Permission check: helferliste:read (management only)
-- =============================================================================

CREATE OR REPLACE FUNCTION get_helferliste_dashboard_data()
RETURNS TABLE (
  event_id uuid,
  name text,
  typ text,
  datum_start timestamptz,
  datum_end timestamptz,
  ort text,
  veranstaltung_id uuid,
  public_token uuid,
  total_benoetigt int,
  total_belegt int,
  ampel text,
  rollen_count int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Permission check: only management can access
  IF NOT is_management() THEN
    RAISE EXCEPTION 'Insufficient permissions';
  END IF;

  RETURN QUERY
  SELECT
    v.event_id,
    v.name,
    v.typ,
    v.datum_start,
    v.datum_end,
    v.ort,
    v.veranstaltung_id,
    v.public_token,
    v.total_benoetigt,
    v.total_belegt,
    v.ampel,
    v.rollen_count
  FROM v_helfer_event_belegung v
  WHERE v.datum_start >= CURRENT_DATE
     OR v.datum_end >= CURRENT_DATE
  ORDER BY v.datum_start ASC;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_helferliste_dashboard_data() TO authenticated;
