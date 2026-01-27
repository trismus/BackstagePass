---
title: UI: Member/Public view for available HelferEvents/Rollen
labels:
  - frontend
  - ui
  - module-1
assignees:
  - Peter
milestone: Helfer Liste
---
## UI: Member/Public view for available HelferEvents/Rollen

**Description:**
Develop the user-facing pages and components for members and the public to view available `helfer_events` and their associated `helfer_rollen_instanzen`.

Key components and functionalities:
*   **Member Page (`apps/web/app/(protected)/helfereinsaetze/page.tsx`):**
    *   Lists all available `helfer_events` visible to authenticated members.
    *   For each event, displays its `helfer_rollen_instanzen` with:
        *   Role name, time block, required persons, and current status (🟢 free, 🟡 partially filled, 🔴 full).
        *   Links/buttons to register for roles.
*   **Public Page (optional, e.g., `apps/web/app/public/helfereinsaetze/[id]/page.tsx`):**
    *   A public-facing page accessible via a shareable link, displaying `helfer_events` and roles marked as `public`.
    *   Similar display of roles and their status.
*   **Component (`apps/web/components/helfereinsaetze/HelferlisteDisplay.tsx`):**
    *   A reusable component to render the list of roles and their occupancy status.

**Acceptance Criteria:**
*   Authenticated members can view all relevant `helfer_events` and their roles.
*   Public users can view public `helfer_events` and roles via a direct link.
*   Role status indicators (free, partially filled, full) are accurate and visually clear.
*   The UI is responsive and provides a good user experience for browsing available helper opportunities.
*   Access control (member vs. public view) is correctly enforced.
