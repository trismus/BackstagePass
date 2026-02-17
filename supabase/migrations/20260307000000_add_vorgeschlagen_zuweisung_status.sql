-- Add 'vorgeschlagen' status to auffuehrung_zuweisungen
-- Issue #344: Auto-generate assignments from cast (Besetzung)

-- Drop existing status check constraint dynamically
DO $$
DECLARE v_name TEXT;
BEGIN
  SELECT conname INTO v_name FROM pg_constraint
  WHERE conrelid = 'auffuehrung_zuweisungen'::regclass
    AND contype = 'c' AND pg_get_constraintdef(oid) LIKE '%status%';
  IF v_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE auffuehrung_zuweisungen DROP CONSTRAINT %I', v_name);
  END IF;
END $$;

-- Re-create with 'vorgeschlagen' included
ALTER TABLE auffuehrung_zuweisungen
  ADD CONSTRAINT auffuehrung_zuweisungen_status_check
  CHECK (status IN ('vorgeschlagen', 'zugesagt', 'abgesagt', 'erschienen', 'nicht_erschienen'));
