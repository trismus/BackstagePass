-- =============================================================================
-- US-10: Configurable cancellation deadline + waitlist auto-promotion
-- =============================================================================

-- Configurable cancellation deadline per helfer_event.
-- If NULL, the default 6-hour-before-event rule applies.
ALTER TABLE helfer_events
  ADD COLUMN IF NOT EXISTS abmeldung_frist TIMESTAMPTZ DEFAULT NULL;

-- -----------------------------------------------------------------------------
-- Atomic waitlist promotion function (SECURITY DEFINER for anon access).
-- Called after a cancellation frees a slot on a rollen_instanz.
-- Returns the promoted anmeldung ID, or NULL if no promotion happened.
-- Uses FOR UPDATE SKIP LOCKED to prevent race conditions.
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION promote_helfer_waitlist(p_rollen_instanz_id UUID)
RETURNS UUID AS $$
DECLARE
  v_anzahl INTEGER;
  v_active INTEGER;
  v_promoted_id UUID;
BEGIN
  -- Lock the rollen_instanz row to prevent concurrent promotions
  SELECT anzahl_benoetigt INTO v_anzahl
  FROM helfer_rollen_instanzen
  WHERE id = p_rollen_instanz_id
  FOR UPDATE;

  IF v_anzahl IS NULL THEN
    RETURN NULL;
  END IF;

  -- Count active (non-waitlist, non-rejected) registrations
  SELECT COUNT(*) INTO v_active
  FROM helfer_anmeldungen
  WHERE rollen_instanz_id = p_rollen_instanz_id
    AND status NOT IN ('abgelehnt', 'warteliste');

  -- Still at capacity?
  IF v_active >= v_anzahl THEN
    RETURN NULL;
  END IF;

  -- Promote the oldest waitlisted entry
  UPDATE helfer_anmeldungen
  SET status = 'angemeldet'
  WHERE id = (
    SELECT id
    FROM helfer_anmeldungen
    WHERE rollen_instanz_id = p_rollen_instanz_id
      AND status = 'warteliste'
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING id INTO v_promoted_id;

  RETURN v_promoted_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION promote_helfer_waitlist TO anon;
GRANT EXECUTE ON FUNCTION promote_helfer_waitlist TO authenticated;
