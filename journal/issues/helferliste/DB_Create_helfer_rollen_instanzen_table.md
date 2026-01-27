---
title: DB: Create helfer_rollen_instanzen table and RLS policies
labels:
  - database
  - backend
  - migration
  - module-1
assignees:
  - Peter
milestone: Helfer Liste
---
## DB: Create helfer_rollen_instanzen table and RLS policies

**Description:**
This task involves defining the schema for the `helfer_rollen_instanzen` table and creating the necessary Supabase migration script. This table will store specific instances of helper roles for `helfer_events`.

The table should include:
*   `id` (UUID, Primary Key)
*   `helfer_event_id` (UUID, Foreign Key to `helfer_events`)
*   `helfer_rollen_template_id` (UUID, Foreign Key to `helfer_rollen_templates`, nullable) - allows custom roles without templates.
*   `custom_rollen_name` (TEXT) - if no template is used.
*   `zeitblock_start` (TIMESTAMP WITH TIME ZONE)
*   `zeitblock_end` (TIMESTAMP WITH TIME ZONE)
*   `benoetigte_personen` (INT)
*   `sichtbarkeit` (ENUM: 'intern', 'public')
*   `created_at` (TIMESTAMP WITH TIME ZONE, default NOW())
*   `updated_at` (TIMESTAMP WITH TIME ZONE, default NOW())

Additionally, implement Row Level Security (RLS) policies for `helfer_rollen_instanzen`:
*   Admin users should have full CRUD access.
*   Authenticated users should be able to view roles based on event visibility.
*   Public users should be able to view roles with `sichtbarkeit = 'public'`.

**Acceptance Criteria:**
*   Supabase migration script `[timestamp]_create_helfer_rollen_instanzen.sql` is created.
*   `helfer_rollen_instanzen` table is correctly defined with all specified columns and types.
*   RLS policies are implemented for admin CRUD, authenticated view, and public view based on visibility.
*   Foreign key constraints to `helfer_events` and `helfer_rollen_templates` are correctly set up.
