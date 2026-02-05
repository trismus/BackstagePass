-- Migration: Notification System for Artistic Production (Issue #167)
-- In-app notifications, user preferences, weekly summary support

-- =============================================================================
-- User Notification Preferences
-- =============================================================================

CREATE TABLE IF NOT EXISTS benachrichtigungs_einstellungen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Email preferences
  email_48h_erinnerung BOOLEAN DEFAULT true,
  email_6h_erinnerung BOOLEAN DEFAULT true,
  email_24h_probe_erinnerung BOOLEAN DEFAULT true,
  email_wochenzusammenfassung BOOLEAN DEFAULT true,
  email_aenderungsbenachrichtigung BOOLEAN DEFAULT true,

  -- In-app preferences
  inapp_termin_erinnerung BOOLEAN DEFAULT true,
  inapp_aenderungen BOOLEAN DEFAULT true,
  inapp_neue_termine BOOLEAN DEFAULT true,

  -- Custom reminder times (in hours before event)
  eigene_erinnerungszeiten INTEGER[] DEFAULT ARRAY[48, 6],

  -- Quiet hours (don't send during these times)
  ruhezeit_von TIME,
  ruhezeit_bis TIME,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger for updated_at
CREATE TRIGGER set_benachrichtigungs_einstellungen_updated_at
  BEFORE UPDATE ON benachrichtigungs_einstellungen
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- In-App Notifications
-- =============================================================================

CREATE TYPE benachrichtigung_typ AS ENUM (
  'termin_erinnerung',      -- Upcoming event reminder
  'termin_geaendert',       -- Event was modified
  'termin_abgesagt',        -- Event was cancelled
  'neue_probe',             -- New rehearsal scheduled
  'neue_einladung',         -- Invited to new event
  'zusage_bestaetigt',      -- Confirmation received
  'wochenzusammenfassung',  -- Weekly summary
  'system'                  -- System notification
);

CREATE TABLE IF NOT EXISTS benachrichtigungen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  typ benachrichtigung_typ NOT NULL,
  titel TEXT NOT NULL,
  nachricht TEXT NOT NULL,

  -- Reference to related entity
  referenz_typ TEXT, -- 'probe', 'veranstaltung', 'anmeldung'
  referenz_id UUID,

  -- Metadata (JSON for flexible data)
  metadata JSONB DEFAULT '{}',

  -- Read status
  gelesen BOOLEAN DEFAULT false,
  gelesen_am TIMESTAMPTZ,

  -- Action URL (for click handling)
  action_url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- Proben Reminders (extends existing reminder system for proben)
-- =============================================================================

CREATE TABLE IF NOT EXISTS proben_erinnerungen_gesendet (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  probe_teilnehmer_id UUID NOT NULL REFERENCES proben_teilnehmer(id) ON DELETE CASCADE,
  erinnerung_typ TEXT NOT NULL CHECK (erinnerung_typ IN ('24h', '1h', 'custom')),
  stunden_vor INTEGER, -- for custom reminders
  sent_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_probe_reminder UNIQUE (probe_teilnehmer_id, erinnerung_typ, stunden_vor)
);

-- =============================================================================
-- Change Notifications Log (for tracking what changed)
-- =============================================================================

CREATE TABLE IF NOT EXISTS aenderungs_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entitaet_typ TEXT NOT NULL, -- 'probe', 'veranstaltung', 'anmeldung'
  entitaet_id UUID NOT NULL,
  aenderung_typ TEXT NOT NULL, -- 'erstellt', 'geaendert', 'abgesagt', 'verschoben'
  aenderungen JSONB, -- what changed (old vs new values)
  geaendert_von UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- Indexes
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_benachrichtigungs_einstellungen_profile
  ON benachrichtigungs_einstellungen(profile_id);

CREATE INDEX IF NOT EXISTS idx_benachrichtigungen_profile
  ON benachrichtigungen(profile_id);
CREATE INDEX IF NOT EXISTS idx_benachrichtigungen_gelesen
  ON benachrichtigungen(profile_id, gelesen) WHERE gelesen = false;
CREATE INDEX IF NOT EXISTS idx_benachrichtigungen_created
  ON benachrichtigungen(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_proben_erinnerungen_teilnehmer
  ON proben_erinnerungen_gesendet(probe_teilnehmer_id);

CREATE INDEX IF NOT EXISTS idx_aenderungs_log_entitaet
  ON aenderungs_log(entitaet_typ, entitaet_id);

-- =============================================================================
-- Row Level Security
-- =============================================================================

ALTER TABLE benachrichtigungs_einstellungen ENABLE ROW LEVEL SECURITY;
ALTER TABLE benachrichtigungen ENABLE ROW LEVEL SECURITY;
ALTER TABLE proben_erinnerungen_gesendet ENABLE ROW LEVEL SECURITY;
ALTER TABLE aenderungs_log ENABLE ROW LEVEL SECURITY;

-- Users can manage their own notification settings
CREATE POLICY "Users can view own settings"
  ON benachrichtigungs_einstellungen FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Users can insert own settings"
  ON benachrichtigungs_einstellungen FOR INSERT
  TO authenticated
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own settings"
  ON benachrichtigungs_einstellungen FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON benachrichtigungen FOR SELECT
  TO authenticated
  USING (profile_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON benachrichtigungen FOR UPDATE
  TO authenticated
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Management can insert notifications for any user
CREATE POLICY "Management can insert notifications"
  ON benachrichtigungen FOR INSERT
  TO authenticated
  WITH CHECK (is_management());

-- System can insert proben reminders
CREATE POLICY "Management can manage proben reminders"
  ON proben_erinnerungen_gesendet FOR ALL
  TO authenticated
  USING (is_management());

-- Management can view change log
CREATE POLICY "Management can view aenderungs_log"
  ON aenderungs_log FOR SELECT
  TO authenticated
  USING (is_management());

CREATE POLICY "Management can insert aenderungs_log"
  ON aenderungs_log FOR INSERT
  TO authenticated
  WITH CHECK (is_management());

-- =============================================================================
-- Views for Pending Proben Reminders
-- =============================================================================

CREATE OR REPLACE VIEW pending_probe_reminders_24h AS
SELECT
  pt.id AS teilnehmer_id,
  pt.person_id,
  pt.probe_id,
  pt.status,
  p.titel AS probe_titel,
  p.datum,
  p.startzeit,
  p.ort,
  p.stueck_id,
  s.titel AS stueck_titel,
  pers.vorname,
  pers.nachname,
  pers.email
FROM proben_teilnehmer pt
JOIN proben p ON p.id = pt.probe_id
JOIN stuecke s ON s.id = p.stueck_id
JOIN personen pers ON pers.id = pt.person_id
WHERE
  pt.status IN ('eingeladen', 'zugesagt', 'vielleicht')
  AND p.status IN ('geplant', 'bestaetigt')
  AND p.datum::date + COALESCE(p.startzeit::time, '00:00'::time)
      BETWEEN NOW() + INTERVAL '22 hours' AND NOW() + INTERVAL '26 hours'
  AND pers.email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM proben_erinnerungen_gesendet pe
    WHERE pe.probe_teilnehmer_id = pt.id AND pe.erinnerung_typ = '24h'
  );

-- =============================================================================
-- Function: Create in-app notification
-- =============================================================================

CREATE OR REPLACE FUNCTION create_inapp_notification(
  p_profile_id UUID,
  p_typ benachrichtigung_typ,
  p_titel TEXT,
  p_nachricht TEXT,
  p_referenz_typ TEXT DEFAULT NULL,
  p_referenz_id UUID DEFAULT NULL,
  p_action_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
  v_settings benachrichtigungs_einstellungen;
BEGIN
  -- Check user preferences
  SELECT * INTO v_settings
  FROM benachrichtigungs_einstellungen
  WHERE profile_id = p_profile_id;

  -- If no settings exist, use defaults (allow all)
  IF v_settings IS NULL THEN
    -- Insert notification
    INSERT INTO benachrichtigungen (
      profile_id, typ, titel, nachricht, referenz_typ, referenz_id, action_url, metadata
    ) VALUES (
      p_profile_id, p_typ, p_titel, p_nachricht, p_referenz_typ, p_referenz_id, p_action_url, p_metadata
    ) RETURNING id INTO v_notification_id;

    RETURN v_notification_id;
  END IF;

  -- Check if notification type is enabled
  IF (p_typ = 'termin_erinnerung' AND NOT v_settings.inapp_termin_erinnerung) OR
     (p_typ IN ('termin_geaendert', 'termin_abgesagt') AND NOT v_settings.inapp_aenderungen) OR
     (p_typ IN ('neue_probe', 'neue_einladung') AND NOT v_settings.inapp_neue_termine) THEN
    RETURN NULL;
  END IF;

  -- Insert notification
  INSERT INTO benachrichtigungen (
    profile_id, typ, titel, nachricht, referenz_typ, referenz_id, action_url, metadata
  ) VALUES (
    p_profile_id, p_typ, p_titel, p_nachricht, p_referenz_typ, p_referenz_id, p_action_url, p_metadata
  ) RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- Function: Log entity change (for change notifications)
-- =============================================================================

CREATE OR REPLACE FUNCTION log_entity_change(
  p_entitaet_typ TEXT,
  p_entitaet_id UUID,
  p_aenderung_typ TEXT,
  p_aenderungen JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO aenderungs_log (
    entitaet_typ, entitaet_id, aenderung_typ, aenderungen, geaendert_von
  ) VALUES (
    p_entitaet_typ, p_entitaet_id, p_aenderung_typ, p_aenderungen, auth.uid()
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- Trigger: Log probe changes
-- =============================================================================

CREATE OR REPLACE FUNCTION notify_probe_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Check if important fields changed
    IF OLD.datum != NEW.datum OR OLD.startzeit IS DISTINCT FROM NEW.startzeit
       OR OLD.ort IS DISTINCT FROM NEW.ort OR OLD.status != NEW.status THEN

      -- Log the change
      PERFORM log_entity_change(
        'probe',
        NEW.id,
        CASE
          WHEN NEW.status = 'abgesagt' THEN 'abgesagt'
          WHEN NEW.status = 'verschoben' THEN 'verschoben'
          ELSE 'geaendert'
        END,
        jsonb_build_object(
          'vorher', jsonb_build_object(
            'datum', OLD.datum,
            'startzeit', OLD.startzeit,
            'ort', OLD.ort,
            'status', OLD.status
          ),
          'nachher', jsonb_build_object(
            'datum', NEW.datum,
            'startzeit', NEW.startzeit,
            'ort', NEW.ort,
            'status', NEW.status
          )
        )
      );

      -- Create notifications for all participants
      INSERT INTO benachrichtigungen (profile_id, typ, titel, nachricht, referenz_typ, referenz_id, action_url)
      SELECT
        pr.id,
        CASE NEW.status
          WHEN 'abgesagt' THEN 'termin_abgesagt'::benachrichtigung_typ
          ELSE 'termin_geaendert'::benachrichtigung_typ
        END,
        CASE NEW.status
          WHEN 'abgesagt' THEN 'Probe abgesagt: ' || NEW.titel
          ELSE 'Probe geändert: ' || NEW.titel
        END,
        CASE NEW.status
          WHEN 'abgesagt' THEN 'Die Probe wurde leider abgesagt.'
          WHEN 'verschoben' THEN 'Die Probe wurde verschoben auf ' || to_char(NEW.datum, 'DD.MM.YYYY')
          ELSE 'Es gab Änderungen an der Probe. Bitte prüfe die Details.'
        END,
        'probe',
        NEW.id,
        '/proben/' || NEW.id
      FROM proben_teilnehmer pt
      JOIN personen p ON p.id = pt.person_id
      JOIN profiles pr ON pr.email = p.email
      WHERE pt.probe_id = NEW.id
        AND pt.status IN ('eingeladen', 'zugesagt', 'vielleicht');
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER probe_change_notification
  AFTER UPDATE ON proben
  FOR EACH ROW
  EXECUTE FUNCTION notify_probe_change();

-- =============================================================================
-- Comments
-- =============================================================================

COMMENT ON TABLE benachrichtigungs_einstellungen IS 'User preferences for notifications';
COMMENT ON TABLE benachrichtigungen IS 'In-app notifications for users';
COMMENT ON TABLE proben_erinnerungen_gesendet IS 'Tracking sent rehearsal reminders';
COMMENT ON TABLE aenderungs_log IS 'Log of entity changes for audit and notifications';
COMMENT ON VIEW pending_probe_reminders_24h IS 'Rehearsals needing 24h reminder emails';
