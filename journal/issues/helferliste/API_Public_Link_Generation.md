---
title: API: Implement public link generation for Helferliste
labels:
  - backend
  - api
  - module-1
assignees:
  - Peter
milestone: Helfer Liste
---
## API: Implement public link generation for Helferliste

**Description:**
Develop an API route and associated logic to securely generate and manage shareable public links for specific `helfer_events` or even individual `helfer_rollen_instanzen`. These links will allow external helpers to view public roles and register without requiring a login.

Considerations:
*   **Link Generation:** A mechanism to generate unique, secure, and optionally short-lived URLs.
*   **Link Management:** Ability for admins to revoke or disable public links.
*   **Access Control:** Ensure that public links only expose `helfer_events` and `helfer_rollen_instanzen` marked as `public`.
*   **Tracking:** Potentially track usage of public links for analytics (optional for v1).

**Acceptance Criteria:**
*   An API endpoint exists to generate a public link for a specified `helfer_event`.
*   Public links, when accessed, correctly display only public `helfer_events` and `helfer_rollen_instanzen`.
*   The links are secure and cannot be easily guessed or manipulated.
*   Admins have a way to view and manage (e.g., disable) generated public links.
