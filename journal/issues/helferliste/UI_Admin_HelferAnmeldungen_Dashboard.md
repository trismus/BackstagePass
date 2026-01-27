---
title: UI: Admin dashboard for HelferAnmeldungen management
labels:
  - frontend
  - ui
  - admin
  - module-1
assignees:
  - Peter
milestone: Helfer Liste
---
## UI: Admin dashboard for HelferAnmeldungen management

**Description:**
Develop an administration dashboard or dedicated section for managing `helfer_anmeldungen`. This will provide the Orga/Produktionsleitung with a live overview of registrations, ability to update statuses, and export functionality.

Key components and functionalities:
*   **Page (`apps/web/app/(protected)/admin/helfer-anmeldungen/page.tsx` or integrated into event details):**
    *   Displays a list of registrations, potentially filterable by `helfer_event`, `helfer_rollen_instanz`, `status`.
    *   Ability to view details of each registration (member info or external contact).
    *   Actions to change registration `status` (e.g., 'bestaetigt', 'abgelehnt', 'warteliste').
    *   Visual indicators (e.g., "Ampel-Logik") for roles needing more helpers.
    *   **Export/Print functionality:** Generate a PDF or CSV of the helferliste for an event.

*   **Component (`apps/web/components/helfereinsaetze/AnmeldungsUebersicht.tsx`):**
    *   A reusable component to display and manage registrations.

**Acceptance Criteria:**
*   Admins can view all `helfer_anmeldungen` and their current statuses.
*   Admins can easily update the status of individual registrations.
*   The dashboard provides a clear overview of helper needs and fulfilled roles.
*   The export functionality works correctly, generating a printable list.
*   The UI is responsive and provides an efficient workflow for managing helpers.
