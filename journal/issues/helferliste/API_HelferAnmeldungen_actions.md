---
title: API: Implement HelferAnmeldungen actions
labels:
  - backend
  - api
  - module-1
assignees:
  - Peter
milestone: Helfer Liste
---
## API: Implement HelferAnmeldungen actions

**Description:**
Implement server actions for managing `helfer_anmeldungen`, covering both internal member registrations and external helper registrations.

The actions should include:
*   `anmeldenMitglied(helferRollenInstanzId)`: Allows an authenticated member to register for a specific helper role instance (1-click registration).
*   `anmeldenExtern(helferRollenInstanzId, externalData)`: Handles registration from external helpers, requiring `name`, `email`, and optionally `telefon`. This endpoint needs robust validation.
*   `cancelAnmeldung(id)`: Allows a user to cancel their own registration, or an admin to cancel any registration.
*   `updateAnmeldungStatus(id, status)`: Allows admin/orga to change the status of a registration (e.g., 'bestaetigt', 'abgelehnt').
*   `getAnmeldungenByRolleInstanzId(id)`: Retrieves all registrations for a specific helper role instance. (Admin-only)
*   `getAnmeldungenByProfileId(profileId)`: Retrieves all registrations for a given member profile. (User can see their own, admin can see all).

**Acceptance Criteria:**
*   Server actions are implemented in `apps/web/lib/actions/helfer_anmeldungen.ts`.
*   Access control (user self-management, admin/orga full access) is correctly enforced.
*   `anmeldenExtern` handles data securely and performs necessary validation for external user input.
*   Error handling is robust for all operations, including potential database conflicts.
