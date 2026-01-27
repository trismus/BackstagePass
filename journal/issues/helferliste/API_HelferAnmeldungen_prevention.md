---
title: API: Implement double-booking/overlap prevention for HelferAnmeldungen
labels:
  - backend
  - api
  - validation
  - module-1
assignees:
  - Peter
milestone: Helfer Liste
---
## API: Implement double-booking/overlap prevention for HelferAnmeldungen

**Description:**
Enhance the `anmeldenMitglied` and `anmeldenExtern` server actions to include logic that prevents users from registering for overlapping helper roles or double-booking themselves for the same event/time slot.

This requires checking:
*   If the user is already registered for the same `helfer_rollen_instanz`.
*   If the user has any other confirmed registrations that overlap with the `zeitblock_start` and `zeitblock_end` of the new registration.

For external users, this check might be based on `external_email`.

**Acceptance Criteria:**
*   The `anmeldenMitglied` action prevents members from double-booking or taking overlapping shifts.
*   The `anmeldenExtern` action prevents external users (identified by email) from double-booking or taking overlapping shifts.
*   Appropriate error messages are returned to the frontend when such conflicts occur.
*   The logic is efficient and does not introduce significant performance overhead.
