-- Migration: Update RLS Policies for Extended Roles
-- Created: 2026-02-10
-- Issue: #108
-- Description: Update all RLS policies to use new role system
-- Depends on: 20260210000000_extended_roles.sql
--
-- Permission Matrix:
--   ADMIN, VORSTAND: Full CRUD on all operational modules
--   MITGLIED_AKTIV: Read events, register self, read own stundenkonto
--   MITGLIED_PASSIV: Read public events, own profile
--   HELFER: Read assigned shifts
--   PARTNER: Own partner data
--   FREUNDE: Public read only

-- =============================================================================
-- personen (Members) - Currently too open, need to restrict
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'personen') THEN
    -- Drop all existing policies
    DROP POLICY IF EXISTS "personen_select" ON personen;
    DROP POLICY IF EXISTS "personen_insert" ON personen;
    DROP POLICY IF EXISTS "personen_update" ON personen;
    DROP POLICY IF EXISTS "personen_delete" ON personen;

    -- Management can see all members
    CREATE POLICY "personen_select_management"
      ON personen FOR SELECT
      TO authenticated
      USING (is_management());

    -- Users can see their own linked person record (via email)
    CREATE POLICY "personen_select_own"
      ON personen FOR SELECT
      TO authenticated
      USING (
        email = (SELECT email FROM profiles WHERE id = auth.uid())
      );

    -- Management can create members
    CREATE POLICY "personen_insert"
      ON personen FOR INSERT
      TO authenticated
      WITH CHECK (is_management());

    -- Management can update any member
    CREATE POLICY "personen_update"
      ON personen FOR UPDATE
      TO authenticated
      USING (is_management())
      WITH CHECK (is_management());

    -- Only admin can delete members
    CREATE POLICY "personen_delete"
      ON personen FOR DELETE
      TO authenticated
      USING (is_admin());
  END IF;
END $$;

-- =============================================================================
-- veranstaltungen (Events) - Update EDITOR -> VORSTAND
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'veranstaltungen') THEN
    DROP POLICY IF EXISTS "veranstaltungen_select" ON veranstaltungen;
    DROP POLICY IF EXISTS "veranstaltungen_insert" ON veranstaltungen;
    DROP POLICY IF EXISTS "veranstaltungen_update" ON veranstaltungen;
    DROP POLICY IF EXISTS "veranstaltungen_delete" ON veranstaltungen;

    -- All authenticated users can read events (public within org)
    CREATE POLICY "veranstaltungen_select"
      ON veranstaltungen FOR SELECT
      TO authenticated
      USING (true);

    -- Management can create events
    CREATE POLICY "veranstaltungen_insert"
      ON veranstaltungen FOR INSERT
      TO authenticated
      WITH CHECK (is_management());

    -- Management can update events
    CREATE POLICY "veranstaltungen_update"
      ON veranstaltungen FOR UPDATE
      TO authenticated
      USING (is_management())
      WITH CHECK (is_management());

    -- Only admin can delete events
    CREATE POLICY "veranstaltungen_delete"
      ON veranstaltungen FOR DELETE
      TO authenticated
      USING (is_admin());
  END IF;
END $$;

-- =============================================================================
-- anmeldungen (Event Registrations)
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'anmeldungen') THEN
    DROP POLICY IF EXISTS "anmeldungen_select" ON anmeldungen;
    DROP POLICY IF EXISTS "anmeldungen_insert" ON anmeldungen;
    DROP POLICY IF EXISTS "anmeldungen_update" ON anmeldungen;
    DROP POLICY IF EXISTS "anmeldungen_delete" ON anmeldungen;

    -- All authenticated can read registrations
    CREATE POLICY "anmeldungen_select"
      ON anmeldungen FOR SELECT
      TO authenticated
      USING (true);

    -- Active members and above can register (themselves via server action)
    CREATE POLICY "anmeldungen_insert"
      ON anmeldungen FOR INSERT
      TO authenticated
      WITH CHECK (
        has_role_permission(ARRAY['ADMIN', 'VORSTAND', 'MITGLIED_AKTIV'])
      );

    -- Users can update own registration, management can update any
    CREATE POLICY "anmeldungen_update"
      ON anmeldungen FOR UPDATE
      TO authenticated
      USING (
        is_management()
        OR person_id IN (
          SELECT p.id FROM personen p
          JOIN profiles pr ON pr.email = p.email
          WHERE pr.id = auth.uid()
        )
      );

    -- Users can delete own registration, management can delete any
    CREATE POLICY "anmeldungen_delete"
      ON anmeldungen FOR DELETE
      TO authenticated
      USING (
        is_management()
        OR person_id IN (
          SELECT p.id FROM personen p
          JOIN profiles pr ON pr.email = p.email
          WHERE pr.id = auth.uid()
        )
      );
  END IF;
END $$;

-- =============================================================================
-- partner (Partner Organizations) - Expand to VORSTAND
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'partner') THEN
    DROP POLICY IF EXISTS "partner_select" ON partner;
    DROP POLICY IF EXISTS "partner_insert" ON partner;
    DROP POLICY IF EXISTS "partner_update" ON partner;
    DROP POLICY IF EXISTS "partner_delete" ON partner;

    -- Management can see all partners
    CREATE POLICY "partner_select_management"
      ON partner FOR SELECT
      TO authenticated
      USING (is_management());

    -- All authenticated can read active partners
    CREATE POLICY "partner_select_active"
      ON partner FOR SELECT
      TO authenticated
      USING (aktiv = true);

    -- Management can manage partners
    CREATE POLICY "partner_insert"
      ON partner FOR INSERT
      TO authenticated
      WITH CHECK (is_management());

    CREATE POLICY "partner_update"
      ON partner FOR UPDATE
      TO authenticated
      USING (is_management())
      WITH CHECK (is_management());

    CREATE POLICY "partner_delete"
      ON partner FOR DELETE
      TO authenticated
      USING (is_admin());
  END IF;
END $$;

-- =============================================================================
-- helfereinsaetze (Helper Events) - Update EDITOR -> VORSTAND
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'helfereinsaetze') THEN
    DROP POLICY IF EXISTS "helfereinsaetze_select" ON helfereinsaetze;
    DROP POLICY IF EXISTS "helfereinsaetze_insert" ON helfereinsaetze;
    DROP POLICY IF EXISTS "helfereinsaetze_update" ON helfereinsaetze;
    DROP POLICY IF EXISTS "helfereinsaetze_delete" ON helfereinsaetze;

    -- Active members and above can see helper events
    CREATE POLICY "helfereinsaetze_select"
      ON helfereinsaetze FOR SELECT
      TO authenticated
      USING (
        has_role_permission(ARRAY['ADMIN', 'VORSTAND', 'MITGLIED_AKTIV', 'HELFER'])
      );

    -- Management can manage helper events
    CREATE POLICY "helfereinsaetze_insert"
      ON helfereinsaetze FOR INSERT
      TO authenticated
      WITH CHECK (is_management());

    CREATE POLICY "helfereinsaetze_update"
      ON helfereinsaetze FOR UPDATE
      TO authenticated
      USING (is_management())
      WITH CHECK (is_management());

    CREATE POLICY "helfereinsaetze_delete"
      ON helfereinsaetze FOR DELETE
      TO authenticated
      USING (is_admin());
  END IF;
END $$;

-- =============================================================================
-- helferrollen (Helper Roles) - Update EDITOR -> VORSTAND
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'helferrollen') THEN
    DROP POLICY IF EXISTS "helferrollen_select" ON helferrollen;
    DROP POLICY IF EXISTS "helferrollen_insert" ON helferrollen;
    DROP POLICY IF EXISTS "helferrollen_update" ON helferrollen;
    DROP POLICY IF EXISTS "helferrollen_delete" ON helferrollen;

    -- Same as helfereinsaetze
    CREATE POLICY "helferrollen_select"
      ON helferrollen FOR SELECT
      TO authenticated
      USING (
        has_role_permission(ARRAY['ADMIN', 'VORSTAND', 'MITGLIED_AKTIV', 'HELFER'])
      );

    CREATE POLICY "helferrollen_insert"
      ON helferrollen FOR INSERT
      TO authenticated
      WITH CHECK (is_management());

    CREATE POLICY "helferrollen_update"
      ON helferrollen FOR UPDATE
      TO authenticated
      USING (is_management())
      WITH CHECK (is_management());

    CREATE POLICY "helferrollen_delete"
      ON helferrollen FOR DELETE
      TO authenticated
      USING (is_management());
  END IF;
END $$;

-- =============================================================================
-- helferschichten (Helper Shifts)
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'helferschichten') THEN
    DROP POLICY IF EXISTS "helferschichten_select" ON helferschichten;
    DROP POLICY IF EXISTS "helferschichten_insert" ON helferschichten;
    DROP POLICY IF EXISTS "helferschichten_update" ON helferschichten;
    DROP POLICY IF EXISTS "helferschichten_delete" ON helferschichten;

    -- Users can see their own shifts, management can see all
    CREATE POLICY "helferschichten_select"
      ON helferschichten FOR SELECT
      TO authenticated
      USING (
        is_management()
        OR person_id IN (
          SELECT p.id FROM personen p
          JOIN profiles pr ON pr.email = p.email
          WHERE pr.id = auth.uid()
        )
      );

    -- Active members can register for shifts
    CREATE POLICY "helferschichten_insert"
      ON helferschichten FOR INSERT
      TO authenticated
      WITH CHECK (
        has_role_permission(ARRAY['ADMIN', 'VORSTAND', 'MITGLIED_AKTIV'])
      );

    -- Own shifts or management
    CREATE POLICY "helferschichten_update"
      ON helferschichten FOR UPDATE
      TO authenticated
      USING (
        is_management()
        OR person_id IN (
          SELECT p.id FROM personen p
          JOIN profiles pr ON pr.email = p.email
          WHERE pr.id = auth.uid()
        )
      );

    CREATE POLICY "helferschichten_delete"
      ON helferschichten FOR DELETE
      TO authenticated
      USING (
        is_management()
        OR person_id IN (
          SELECT p.id FROM personen p
          JOIN profiles pr ON pr.email = p.email
          WHERE pr.id = auth.uid()
        )
      );
  END IF;
END $$;

-- =============================================================================
-- stundenkonto (Hours Ledger)
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stundenkonto') THEN
    DROP POLICY IF EXISTS "stundenkonto_select" ON stundenkonto;
    DROP POLICY IF EXISTS "stundenkonto_insert" ON stundenkonto;
    DROP POLICY IF EXISTS "stundenkonto_update" ON stundenkonto;
    DROP POLICY IF EXISTS "stundenkonto_delete" ON stundenkonto;

    -- Active members can see their own hours
    CREATE POLICY "stundenkonto_select_own"
      ON stundenkonto FOR SELECT
      TO authenticated
      USING (
        person_id IN (
          SELECT p.id FROM personen p
          JOIN profiles pr ON pr.email = p.email
          WHERE pr.id = auth.uid()
        )
      );

    -- Management can see all
    CREATE POLICY "stundenkonto_select_management"
      ON stundenkonto FOR SELECT
      TO authenticated
      USING (is_management());

    -- Management can manage
    CREATE POLICY "stundenkonto_insert"
      ON stundenkonto FOR INSERT
      TO authenticated
      WITH CHECK (is_management());

    CREATE POLICY "stundenkonto_update"
      ON stundenkonto FOR UPDATE
      TO authenticated
      USING (is_management())
      WITH CHECK (is_management());

    CREATE POLICY "stundenkonto_delete"
      ON stundenkonto FOR DELETE
      TO authenticated
      USING (is_admin());
  END IF;
END $$;

-- =============================================================================
-- stuecke (Plays)
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'stuecke') THEN
    DROP POLICY IF EXISTS "stuecke_insert" ON stuecke;
    DROP POLICY IF EXISTS "stuecke_update" ON stuecke;
    DROP POLICY IF EXISTS "stuecke_delete" ON stuecke;

    CREATE POLICY "stuecke_insert"
      ON stuecke FOR INSERT
      TO authenticated
      WITH CHECK (is_management());

    CREATE POLICY "stuecke_update"
      ON stuecke FOR UPDATE
      TO authenticated
      USING (is_management());

    CREATE POLICY "stuecke_delete"
      ON stuecke FOR DELETE
      TO authenticated
      USING (is_admin());
  END IF;
END $$;

-- =============================================================================
-- raeume (Rooms)
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'raeume') THEN
    DROP POLICY IF EXISTS "raeume_insert" ON raeume;
    DROP POLICY IF EXISTS "raeume_update" ON raeume;
    DROP POLICY IF EXISTS "raeume_delete" ON raeume;

    CREATE POLICY "raeume_insert"
      ON raeume FOR INSERT
      TO authenticated
      WITH CHECK (is_management());

    CREATE POLICY "raeume_update"
      ON raeume FOR UPDATE
      TO authenticated
      USING (is_management());

    CREATE POLICY "raeume_delete"
      ON raeume FOR DELETE
      TO authenticated
      USING (is_admin());
  END IF;
END $$;

-- =============================================================================
-- ressourcen (Equipment)
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ressourcen') THEN
    DROP POLICY IF EXISTS "ressourcen_insert" ON ressourcen;
    DROP POLICY IF EXISTS "ressourcen_update" ON ressourcen;
    DROP POLICY IF EXISTS "ressourcen_delete" ON ressourcen;

    CREATE POLICY "ressourcen_insert"
      ON ressourcen FOR INSERT
      TO authenticated
      WITH CHECK (is_management());

    CREATE POLICY "ressourcen_update"
      ON ressourcen FOR UPDATE
      TO authenticated
      USING (is_management());

    CREATE POLICY "ressourcen_delete"
      ON ressourcen FOR DELETE
      TO authenticated
      USING (is_admin());
  END IF;
END $$;

-- =============================================================================
-- auffuehrung_templates (Performance Templates)
-- =============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'auffuehrung_templates') THEN
    DROP POLICY IF EXISTS "auffuehrung_templates_insert" ON auffuehrung_templates;
    DROP POLICY IF EXISTS "auffuehrung_templates_update" ON auffuehrung_templates;
    DROP POLICY IF EXISTS "auffuehrung_templates_delete" ON auffuehrung_templates;

    CREATE POLICY "auffuehrung_templates_insert"
      ON auffuehrung_templates FOR INSERT
      TO authenticated
      WITH CHECK (is_management());

    CREATE POLICY "auffuehrung_templates_update"
      ON auffuehrung_templates FOR UPDATE
      TO authenticated
      USING (is_management());

    CREATE POLICY "auffuehrung_templates_delete"
      ON auffuehrung_templates FOR DELETE
      TO authenticated
      USING (is_admin());
  END IF;
END $$;
