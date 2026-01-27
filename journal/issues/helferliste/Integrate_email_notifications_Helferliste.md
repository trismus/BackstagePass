---
title: Integrate email notifications for Helferliste
labels:
  - backend
  - notifications
  - module-1
assignees:
  - Peter
milestone: Helfer Liste
---
## Integrate email notifications for Helferliste

**Description:**
Implement basic email notification services to inform members and external helpers about relevant "Helferliste" events.

Consider the following notification types:
*   **New HelferEvent Publication:** Notify members when a new `helfer_event` is published (if they opt-in).
*   **Registration Confirmation:** Send a confirmation email to members/external helpers upon successful registration for a `helfer_rollen_instanz`.
*   **Status Update:** Notify users if their registration status changes (e.g., from 'angemeldet' to 'bestaetigt' or 'abgelehnt').

This task involves:
*   Setting up or integrating with an email sending service (e.g., through Supabase's capabilities or a third-party provider).
*   Creating email templates for different notification types.
*   Triggering these notifications from the appropriate backend server actions.

**Acceptance Criteria:**
*   Email notifications are sent automatically for specified events.
*   Emails are well-formatted and contain all necessary information.
*   The notification system is reliable and handles sending failures gracefully.
*   Members can manage their notification preferences (optional, but good for future).
