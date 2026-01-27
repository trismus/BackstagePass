---
title: Tests: End-to-End tests for Helferliste workflows
labels:
  - tests
  - e2e
  - module-1
assignees:
  - Peter
milestone: Helfer Liste
---
## Tests: End-to-End tests for Helferliste workflows

**Description:**
Develop end-to-end (E2E) tests to verify the complete user flows for the "Helferliste" feature, covering both internal member and external helper experiences, as well as administrative tasks.

This task includes:
*   **Admin Workflow:**
    *   Creating a new `helfer_event`.
    *   Adding `helfer_rollen_instanzen` (from template and custom).
    *   Publishing an event.
    *   Managing `helfer_anmeldungen` (changing status, viewing overview).
*   **Member Workflow:**
    *   Viewing available `helfer_events` and roles.
    *   Registering for a role (1-click).
    *   Canceling a registration.
*   **External Helper Workflow:**
    *   Accessing a public `helfer_event` via a link.
    *   Registering for a public role via the external form.
*   **Validation Scenarios:** Test for double-booking/overlap prevention.

**Acceptance Criteria:**
*   E2E test suite is created using an appropriate framework (e.g., Playwright, Cypress).
*   Key user journeys for admin, members, and external helpers are covered.
*   All E2E tests pass consistently.
*   Tests simulate real user interactions and verify expected outcomes across the application stack.
