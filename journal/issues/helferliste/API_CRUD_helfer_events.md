---
title: API: Implement CRUD for helfer_events
labels:
  - backend
  - api
  - module-1
assignees:
  - Peter
milestone: Helfer Liste
---
## API: Implement CRUD for helfer_events

**Description:**
Implement the necessary server actions (Next.js App Router) for Create, Read, Update, and Delete operations for `helfer_events`. These actions should enforce appropriate access control, primarily allowing only administrative users (Orga/Produktionsleitung) to perform CRUD operations.

The actions should include:
*   `createHelferEvent(data)`: Creates a new helper event. (Admin-only)
*   `updateHelferEvent(id, data)`: Updates an existing helper event. (Admin-only)
*   `getHelferEvents(filters)`: Retrieves a list of helper events. Should allow filtering and respect event visibility for authenticated users.
*   `getHelferEventById(id)`: Retrieves a single helper event by its ID.
*   `deleteHelferEvent(id)`: Deletes a helper event. (Admin-only)

**Acceptance Criteria:**
*   Server actions are implemented in `apps/web/lib/actions/helfer_events.ts`.
*   Access control (admin-only for CUD, appropriate view for R) is correctly enforced using Supabase RLS and/or server-side checks.
*   Actions perform necessary data validation before interacting with the database.
*   Error handling is implemented for database operations and access violations.
