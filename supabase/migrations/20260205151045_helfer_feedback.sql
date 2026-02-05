-- Migration: Helfer Feedback System
-- Created: 2026-02-05
-- Description: Add feedback_token to track thank you emails and helfer_feedback table (Issue #229)

-- =============================================================================
-- Add feedback_token to auffuehrung_zuweisungen
-- =============================================================================

ALTER TABLE auffuehrung_zuweisungen
ADD COLUMN IF NOT EXISTS feedback_token UUID DEFAULT gen_random_uuid();

-- Create index for token lookup
CREATE INDEX IF NOT EXISTS auffuehrung_zuweisungen_feedback_token_idx
ON auffuehrung_zuweisungen(feedback_token);

-- =============================================================================
-- TABLE: helfer_feedback
-- =============================================================================

CREATE TABLE IF NOT EXISTS helfer_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zuweisung_id UUID NOT NULL REFERENCES auffuehrung_zuweisungen(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback_positiv TEXT,
  feedback_verbesserung TEXT,
  wieder_helfen BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE helfer_feedback ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "helfer_feedback_insert_anon" ON helfer_feedback;
DROP POLICY IF EXISTS "helfer_feedback_select_admin" ON helfer_feedback;

-- Policy: Anonymous users can insert feedback via valid token
CREATE POLICY "helfer_feedback_insert_anon"
  ON helfer_feedback FOR INSERT
  TO anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auffuehrung_zuweisungen az
      WHERE az.id = zuweisung_id
      AND az.feedback_token IS NOT NULL
    )
  );

-- Policy: Authenticated users can also insert
CREATE POLICY "helfer_feedback_insert_auth"
  ON helfer_feedback FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Management can read all feedback
CREATE POLICY "helfer_feedback_select_admin"
  ON helfer_feedback FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'VORSTAND')
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS helfer_feedback_zuweisung_idx ON helfer_feedback(zuweisung_id);
CREATE INDEX IF NOT EXISTS helfer_feedback_rating_idx ON helfer_feedback(rating);
CREATE INDEX IF NOT EXISTS helfer_feedback_created_idx ON helfer_feedback(created_at DESC);

-- =============================================================================
-- TABLE: thank_you_emails_sent
-- Track which thank you emails have been sent for deduplication
-- =============================================================================

CREATE TABLE IF NOT EXISTS thank_you_emails_sent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  veranstaltung_id UUID NOT NULL REFERENCES veranstaltungen(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_count INTEGER NOT NULL DEFAULT 0,
  only_attended BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(veranstaltung_id)
);

-- Enable RLS
ALTER TABLE thank_you_emails_sent ENABLE ROW LEVEL SECURITY;

-- Policy: Management can read/write
DROP POLICY IF EXISTS "thank_you_emails_sent_select" ON thank_you_emails_sent;
DROP POLICY IF EXISTS "thank_you_emails_sent_insert" ON thank_you_emails_sent;

CREATE POLICY "thank_you_emails_sent_select"
  ON thank_you_emails_sent FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'VORSTAND')
    )
  );

CREATE POLICY "thank_you_emails_sent_insert"
  ON thank_you_emails_sent FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'VORSTAND')
    )
  );

CREATE POLICY "thank_you_emails_sent_delete"
  ON thank_you_emails_sent FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('ADMIN', 'VORSTAND')
    )
  );

-- Create index
CREATE INDEX IF NOT EXISTS thank_you_emails_sent_veranstaltung_idx
ON thank_you_emails_sent(veranstaltung_id);
