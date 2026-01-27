---
title: UI: Admin component for HelferRollenInstanz management
labels:
  - frontend
  - ui
  - admin
  - module-1
assignees:
  - Peter
milestone: Helfer Liste
---
## UI: Admin component for HelferRollenInstanz management

**Description:**
Develop a reusable UI component for creating, viewing, editing, and deleting `helfer_rollen_instanzen` (specific role instances for an event). This component will likely be integrated within the `HelferEventForm` or a dedicated event detail page.

Key functionalities:
*   Display a list of `helfer_rollen_instanzen` for a specific `helfer_event_id`.
*   Functionality to "Add New Role Instance":
    *   Option to select from existing `helfer_rollen_templates`.
    *   Option to create a custom role (input for `custom_rollen_name`).
    *   Input fields for `zeitblock_start`, `zeitblock_end`, `benoetigte_personen`, `sichtbarkeit`.
*   Actions to "Edit Role Instance" and "Delete Role Instance".
*   Display current occupancy status for each role instance.

**Acceptance Criteria:**
*   The component allows admins to add, edit, and delete `helfer_rollen_instanzen` for an event.
*   Admins can easily select templates or define custom roles.
*   Input validation is present.
*   The component clearly displays the current state and occupancy of roles.
*   The UI integrates seamlessly with the admin interface.
