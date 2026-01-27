---
title: Tests: Unit/Integration tests for Helferliste features
labels:
  - tests
  - module-1
assignees:
  - Peter
milestone: Helfer Liste
---
## Tests: Unit/Integration tests for Helferliste features

**Description:**
Write comprehensive unit and integration tests for all new components of the "Helferliste" feature, covering database migrations, backend server actions, and critical frontend logic.

This task includes:
*   **Database Migrations:** Tests to ensure migrations apply correctly and roll back if needed (manual check during development).
*   **Backend Server Actions:**
    *   Unit tests for each action in `helfer_events.ts`, `helfer_rollen_instanzen.ts`, and `helfer_anmeldungen.ts`.
    *   Tests should cover successful operations, edge cases, input validation, and access control enforcement.
    *   Mock Supabase client where appropriate, or use integration tests with a test database.
*   **Frontend Logic:**
    *   Unit tests for utility functions and complex state management within UI components.
    *   Integration tests for form submissions and user interactions with key components (e.g., registration buttons, admin forms).

**Acceptance Criteria:**
*   Test files are created for all new backend actions and significant frontend logic.
*   Tests cover at least 80% code coverage for new backend code.
*   All tests pass successfully.
*   Tests validate correct behavior under various conditions, including valid/invalid input and different user roles.
