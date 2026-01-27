# BRIEF: Module 1 - Helferliste Work Packages

**Reviewed By:** Martin (Bühnenmeister)
**Date:** 2026-01-27
**Concept Document:** `journal/konzept/helferliste-konzept.md`

---

### Architectural Review Summary:

The "Helferliste" concept is well-structured. Key architectural considerations include:
*   **Data Model:** Crucial for separating `HelferEvent`, `HelferRolle`, and `Anmeldung`. Clear relationships to existing `veranstaltungen` and `profiles` are necessary.
*   **RLS & Security:** Careful implementation of Row Level Security is required to differentiate access for admins, internal members, and external participants, especially for public-facing roles and registration. Secure handling of external submissions (e.g., via Edge Functions or secure API routes) is paramount.
*   **API Design:** Next.js Server Actions or API Routes will be central for CRUD operations, validation, and managing the various phases of the process.
*   **Future-Proofing:** The design should consider potential future expansions, such as the "Nachbearbeitung" phase (e.g., `EinsatzHistorie` and `Helferpunkte`).

---

### Work Packages (Work Breakdown for Kulissenbauer Peter):

This is a breakdown of tasks for the initial implementation of the Helferliste, following a database-first approach and then progressively building out the backend API and frontend UI.

**Module 1: Helferliste (Initial Implementation)**

1.  **Datenmodell & Supabase Migrations (Database-First Approach)**
    *   [ ] **Define & Create `helfer_events` table:** (Migration Script)
        *   `id` (UUID), `type` (ENUM: 'auffuehrung', 'helfereinsatz'), `veranstaltung_id` (UUID, FK to `veranstaltungen`, nullable), `name`, `description`, `start_date`, `end_date`, `location`, `created_at`, `updated_at`.
        *   RLS Policies for `helfer_events` (admin CRUD, authenticated view).
    *   [ ] **Define & Create `helfer_rollen_templates` table:** (Migration Script)
        *   `id` (UUID), `name` (e.g., 'Kasse', 'Service'), `default_anzahl_personen` (INT), `description` (TEXT), `created_at`, `updated_at`.
        *   RLS Policies for `helfer_rollen_templates` (admin CRUD, authenticated view).
    *   [ ] **Define & Create `helfer_rollen_instanzen` table:** (Migration Script)
        *   `id` (UUID), `helfer_event_id` (UUID, FK to `helfer_events`), `helfer_rollen_template_id` (UUID, FK to `helfer_rollen_templates`, nullable), `custom_rollen_name` (TEXT, if no template), `zeitblock_start`, `zeitblock_end`, `benoetigte_personen` (INT), `sichtbarkeit` (ENUM: 'intern', 'public'), `created_at`, `updated_at`.
        *   RLS Policies for `helfer_rollen_instanzen` (admin CRUD, authenticated view, public view for public roles).
    *   [ ] **Define & Create `helfer_anmeldungen` table:** (Migration Script)
        *   `id` (UUID), `helfer_rollen_instanz_id` (UUID, FK to `helfer_rollen_instanzen`), `profile_id` (UUID, FK to `profiles`, nullable for external), `external_name`, `external_email`, `external_telefon` (nullable), `status` (ENUM: 'angemeldet', 'bestaetigt', 'abgelehnt', 'warteliste'), `created_at`.
        *   RLS Policies for `helfer_anmeldungen` (authenticated user can insert/view/update their own, admin/orga CRUD all).
    *   [ ] **Audit Logging Integration:** Extend audit logging (if not already done) to track critical actions on `helfer_events`, `helfer_rollen_instanzen`, and `helfer_anmeldungen` (creation, update, status changes).

2.  **Backend API (Next.js Server Actions / API Routes)**
    *   [ ] **`apps/web/lib/actions/helfer_events.ts`:**
        *   `createHelferEvent(data)` (admin-only)
        *   `updateHelferEvent(id, data)` (admin-only)
        *   `getHelferEvents(filters)` (authenticated/public view based on visibility)
        *   `getHelferEventById(id)`
        *   `deleteHelferEvent(id)` (admin-only)
    *   [ ] **`apps/web/lib/actions/helfer_rollen_instanzen.ts`:**
        *   `createHelferRolle(helferEventId, data)` (admin-only, including from template)
        *   `updateHelferRolle(id, data)` (admin-only)
        *   `getHelferRollenByEventId(helferEventId, userId?)` (authenticated/public view, showing status)
        *   `deleteHelferRolle(id)` (admin-only)
    *   [ ] **`apps/web/lib/actions/helfer_anmeldungen.ts`:**
        *   `anmeldenMitglied(helferRollenInstanzId)` (authenticated user)
        *   `anmeldenExtern(helferRollenInstanzId, externalData)` (public endpoint, with validation)
        *   `cancelAnmeldung(id)` (user/admin)
        *   `updateAnmeldungStatus(id, status)` (admin-only)
        *   `getAnmeldungenByRolleInstanzId(id)` (admin-only)
        *   `getAnmeldungenByProfileId(profileId)` (user can see their own)
    *   [ ] **Implement Systemprüfung:** Logic for double-booking/overlap prevention within `anmeldenMitglied` and `anmeldenExtern` actions.

3.  **Frontend UI (Next.js Components & Pages)**
    *   [ ] **Admin: Page & Form for `HelferEvent` Creation/Management:**
        *   Page: `apps/web/app/(protected)/admin/helfer-events/page.tsx`
        *   Form: `apps/web/components/helfer/HelferEventForm.tsx` (using existing `Input`, `Button`, `Card` components)
    *   [ ] **Admin: Page & Form for `HelferRollenTemplate` Management:**
        *   Page: `apps/web/app/(protected)/admin/helfer-rollen-templates/page.tsx`
        *   Form: `apps/web/components/helfer/HelferRollenTemplateForm.tsx`
    *   [ ] **Admin: Component for `HelferRollenInstanz` Creation/Management within an Event:**
        *   Integrated into `HelferEventForm` or dedicated `apps/web/components/helfer/HelferRollenManager.tsx`. Includes template selection.
    *   [ ] **Public/Member View: Overview of Available `HelferEvents` & `HelferRollen`:**
        *   Page: `apps/web/app/(protected)/helfereinsaetze/page.tsx` (for members) and potentially `apps/web/app/public/helfereinsaetze/[id]/page.tsx` (for external link).
        *   Component: `apps/web/components/helfereinsaetze/HelferlisteDisplay.tsx` (showing roles, status 🟢🟡🔴).
    *   [ ] **Frontend: Registration Forms:**
        *   `apps/web/components/helfereinsaetze/AnmeldeButtonMitglied.tsx` (1-click for members).
        *   `apps/web/components/helfereinsaetze/AnmeldeFormExtern.tsx` (for external users).
    *   [ ] **Admin: Management Dashboard for `HelferAnmeldungen`:**
        *   Page: `apps/web/app/(protected)/admin/helfer-anmeldungen/page.tsx` or integrated into `helfer-events` management.
        *   Component: `apps/web/components/helfereinsaetze/AnmeldungsUebersicht.tsx` (live overview, status updates, export).

4.  **Notifications & Publishing**
    *   [ ] **`apps/web/lib/actions/notifications.ts`:** Implement basic email notification service for members on new events/roles.
    *   [ ] **API Route for Public Link Generation:** Securely generate and manage public links for events/roles.

5.  **Refinement & Testing**
    *   [ ] **Unit/Integration Tests:** Cover all new database migrations, server actions, and critical frontend logic.
    *   [ ] **End-to-End Tests:** Verify the full flow for both internal and external users.
    *   [ ] **Error Handling & UI Feedback:** Implement robust error handling and clear user feedback.