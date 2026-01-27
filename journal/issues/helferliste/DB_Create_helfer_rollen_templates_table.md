---
title: DB: Create helfer_rollen_templates table and RLS policies
labels:
  - database
  - backend
  - migration
  - module-1
assignees:
  - Peter
milestone: Helfer Liste
---
## DB: Create helfer_rollen_templates table and RLS policies

**Description:**
This task involves defining the schema for the `helfer_rollen_templates` table and creating the necessary Supabase migration script. This table will store reusable templates for helper roles.

The table should include:
*   `id` (UUID, Primary Key)
*   `name` (TEXT, e.g., 'Kasse', 'Service')
*   `default_anzahl_personen` (INT)
*   `description` (TEXT)
*   `created_at` (TIMESTAMP WITH TIME ZONE, default NOW())
*   `updated_at` (TIMESTAMP WITH TIME ZONE, default NOW())

Additionally, implement Row Level Security (RLS) policies for `helfer_rollen_templates`:
*   Admin users should have full CRUD access.
*   Authenticated users should be able to view templates.

**Acceptance Criteria:**
*   Supabase migration script `[timestamp]_create_helfer_rollen_templates.sql` is created.
*   `helfer_rollen_templates` table is correctly defined with all specified columns and types.
*   RLS policies are implemented to allow admin CRUD and authenticated view.
