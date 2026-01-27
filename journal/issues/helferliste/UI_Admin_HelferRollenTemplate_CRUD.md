---
title: UI: Admin page for HelferRollenTemplate management
labels:
  - frontend
  - ui
  - admin
  - module-1
assignees:
  - Peter
milestone: Helfer Liste
---
## UI: Admin page for HelferRollenTemplate management

**Description:**
Develop an administration page for creating, viewing, editing, and deleting `helfer_rollen_templates`. This page will allow administrators to define and manage reusable helper role templates.

Key components and functionalities:
*   **Page (`apps/web/app/(protected)/admin/helfer-rollen-templates/page.tsx`):**
    *   Table/List view of all `helfer_rollen_templates`.
    *   Actions to "Create New Template", "Edit Template", "Delete Template".
*   **Form (`apps/web/components/helfer/HelferRollenTemplateForm.tsx`):**
    *   Input fields for `name`, `default_anzahl_personen`, `description`.
    *   Validation for all form inputs.
    *   Utilize existing UI components.

**Acceptance Criteria:**
*   The admin page for `helfer_rollen_templates` is accessible only by authorized admin users.
*   Admins can successfully create, edit, and delete helper role templates through the UI.
*   The form includes all necessary fields and provides clear feedback.
*   The list/table of templates accurately displays data from the backend.
*   The UI adheres to the project's design system and conventions.
