-- Migration: Add text field to szenen table for script editing (Issue #193)
-- This enables directors and actors to edit and view scene scripts

-- Add text column to szenen table
ALTER TABLE szenen
ADD COLUMN text TEXT;

-- Add comment to document the column
COMMENT ON COLUMN szenen.text IS 'Der Szenentext (Script) - editierbar während Proben';
