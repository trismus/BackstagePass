---
title: DB: Create helfer_anmeldungen table and RLS policies
labels:
  - database
  - backend
  - migration
  - module-1
assignees:
  - Peter
milestone: Helfer Liste
---
## DB: Create helfer_anmeldungen table and RLS policies

**Description:**
This task involves defining the schema for the `helfer_anmeldungen` table and creating the necessary Supabase migration script. This table will store all registrations for `helfer_rollen_instanzen`.

The table should include:
*   `id` (UUID, Primary Key)
*   `helfer_rollen_instanz_id` (UUID, Foreign Key to `helfer_rollen_instanzen`)
*   `profile_id` (UUID, Foreign Key to `profiles`, nullable) - for internal members.
*   `external_name` (TEXT, nullable) - for external helpers.
*   `external_email` (TEXT, nullable) - for external helpers.
*   `external_telefon` (TEXT, nullable) - for external helpers.
*   `status` (ENUM: 'angemeldet', 'bestaetigt', 'abgelehnt', 'warteliste')
*   `created_at` (TIMESTAMP WITH TIME ZONE, default NOW())

Additionally, implement Row Level Security (RLS) policies for `helfer_anmeldungen`:
*   Authenticated users should be able to insert new registrations.
*   Authenticated users should be able to view and update/delete their own registrations.
*   Admin/Orga users should have full CRUD access to all registrations.

**Acceptance Criteria:**
*   Supabase migration script `[timestamp]_create_helfer_anmeldungen.sql` is created.
*   `helfer_anmeldungen` table is correctly defined with all specified columns and types.
*   RLS policies are implemented for authenticated user self-management and admin/orga full access.
*   Foreign key constraint to `helfer_rollen_instanzen` and `profiles` are correctly set up.
