---
title: Integrate helferliste actions with audit logging
labels:
  - backend
  - audit-log
  - module-1
assignees:
  - Peter
milestone: Helfer Liste
---
## Integrate helferliste actions with audit logging

**Description:**
Extend the existing audit logging mechanism to capture critical actions related to the "Helferliste" feature. This involves integrating audit log entries for creation, updates, and status changes of `helfer_events`, `helfer_rollen_instanzen`, and `helfer_anmeldungen`.

Consider the following actions for audit logging:
*   Creation/Update/Deletion of `helfer_events`.
*   Creation/Update/Deletion of `helfer_rollen_instanzen`.
*   Status changes of `helfer_anmeldungen` (e.g., from 'angemeldet' to 'bestaetigt').
*   External user registrations.

Utilize the existing `log_audit_event` function or adapt it as needed.

**Acceptance Criteria:**
*   Critical actions on `helfer_events`, `helfer_rollen_instanzen`, and `helfer_anmeldungen` are logged in the `audit_logs` table.
*   Audit log entries contain relevant information such as `user_id`, `action`, `entity_type`, `entity_id`, and `details` (e.g., old/new values for updates).
*   Logging functions are integrated into the respective server actions or database triggers.
