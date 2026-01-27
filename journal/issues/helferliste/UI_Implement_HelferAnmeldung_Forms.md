---
title: UI: Implement HelferAnmeldung forms
labels:
  - frontend
  - ui
  - module-1
assignees:
  - Peter
milestone: Helfer Liste
---
## UI: Implement HelferAnmeldung forms

**Description:**
Develop the user interface components for both internal members and external helpers to register for `helfer_rollen_instanzen`.

Key components and functionalities:
*   **1-Click Registration for Members (`apps/web/components/helfereinsaetze/AnmeldeButtonMitglied.tsx`):**
    *   A simple button that, when clicked, registers the authenticated user for the selected role.
    *   Provides immediate feedback (e.g., success message, button state change).
*   **External Registration Form (`apps/web/components/helfereinsaetze/AnmeldeFormExtern.tsx`):**
    *   A form for unauthenticated users to provide their `name`, `email`, and optionally `telefon` to register for a public helper role.
    *   Includes client-side validation for input fields.
    *   Integrates with the `anmeldenExtern` API action.
    *   Clear success/error messages after submission.

**Acceptance Criteria:**
*   Authenticated members can successfully register for roles with a single click.
*   External users can successfully register for public roles through the dedicated form.
*   Forms provide clear validation feedback and handle API responses gracefully.
*   Double-booking/overlap prevention (from backend) is reflected in the UI (e.g., cannot register if already booked).
*   The UI is intuitive and easy to use for both user groups.
