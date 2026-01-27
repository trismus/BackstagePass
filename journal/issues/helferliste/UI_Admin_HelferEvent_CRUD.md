---
title: UI: Admin page for HelferEvent creation/management
labels:
  - frontend
  - ui
  - admin
  - module-1
assignees:
  - Peter
milestone: Helfer Liste
---
## UI: Admin page for HelferEvent creation/management

**Description:**
Develop a dedicated administration page for creating, viewing, editing, and deleting `helfer_events`. This page will serve as the central hub for the Orga/Produktionsleitung to manage all helper events.

Key components and functionalities:
*   **Page (`apps/web/app/(protected)/admin/helfer-events/page.tsx`):**
    *   Table/List view of all `helfer_events`.
    *   Ability to filter, sort, and search events.
    *   Actions to "Create New Event", "Edit Event", "Delete Event".
    *   Links to manage `helfer_rollen_instanzen` for each event.
*   **Form (`apps/web/components/helfer/HelferEventForm.tsx`):**
    *   Input fields for `name`, `description`, `type`, `start_date`, `end_date`, `location`.
    *   Optional field to link to an existing `veranstaltung`.
    *   Validation for all form inputs.
    *   Utilize existing UI components like `Input`, `Button`, `Card` from `components/ui`.

**Acceptance Criteria:**
*   The admin page for `helfer_events` is accessible only by authorized admin users.
*   Admins can successfully create, edit, and delete helper events through the UI.
*   The form includes all necessary fields and provides clear feedback on user input.
*   The list/table of events accurately displays data from the backend.
*   The UI adheres to the project's design system and conventions.
