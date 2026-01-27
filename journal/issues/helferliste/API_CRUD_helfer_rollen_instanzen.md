---
title: API: Implement CRUD for helfer_rollen_instanzen
labels:
  - backend
  - api
  - module-1
assignees:
  - Peter
milestone: Helfer Liste
---
## API: Implement CRUD for helfer_rollen_instanzen

**Description:**
Implement the necessary server actions (Next.js App Router) for Create, Read, Update, and Delete operations for `helfer_rollen_instanzen`. These actions should enforce appropriate access control, primarily allowing only administrative users to perform CRUD operations.

The actions should include:
*   `createHelferRolle(helferEventId, data)`: Creates a new helper role instance for a given event. Should support creation from a template or with custom details. (Admin-only)
*   `updateHelferRolle(id, data)`: Updates an existing helper role instance. (Admin-only)
*   `getHelferRollenByEventId(helferEventId, userId?)`: Retrieves all helper role instances for a specific event. Should respect visibility and provide current occupancy status.
*   `deleteHelferRolle(id)`: Deletes a helper role instance. (Admin-only)

**Acceptance Criteria:**
*   Server actions are implemented in `apps/web/lib/actions/helfer_rollen_instanzen.ts`.
*   Access control (admin-only for CUD, appropriate view for R based on event visibility) is correctly enforced.
*   Actions correctly handle creation from `helfer_rollen_templates` or using custom role names.
*   Error handling is implemented for database operations and access violations.
