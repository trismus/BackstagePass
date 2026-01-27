---
title: DB: Create helfer_events table and RLS policies
labels:
  - database
  - backend
  - migration
  - module-1
assignees:
  - Peter
milestone: Helfer Liste
---
## DB: Create helfer_events table and RLS policies

**Description:**
As part of the "Helferliste" feature, this task involves defining the schema for the `helfer_events` table and creating the necessary Supabase migration script.

The table should include:
*   `id` (UUID, Primary Key)
*   `type` (ENUM: 'auffuehrung', 'helfereinsatz')
*   `veranstaltung_id` (UUID, Foreign Key to `veranstaltungen`, nullable) - for linking to existing events.
*   `name` (TEXT)
*   `description` (TEXT)
*   `start_date` (TIMESTAMP WITH TIME ZONE)
*   `end_date` (TIMESTAMP WITH TIME ZONE)
*   `location` (TEXT)
*   `created_at` (TIMESTAMP WITH TIME ZONE, default NOW())
*   `updated_at` (TIMESTAMP WITH TIME ZONE, default NOW())

Additionally, implement Row Level Security (RLS) policies for `helfer_events`:
*   Admin users should have full CRUD access.
*   Authenticated users should be able to view events (consider visibility logic if applicable).

**Acceptance Criteria:**
*   Supabase migration script `[timestamp]_create_helfer_events.sql` is created.
*   `helfer_events` table is correctly defined with all specified columns and types.
*   RLS policies are implemented to allow admin CRUD and authenticated view.
*   Foreign key constraint to `veranstaltungen` table (if applicable) is correctly set up.
