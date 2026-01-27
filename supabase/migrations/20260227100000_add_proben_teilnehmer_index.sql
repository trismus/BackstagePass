-- Migration: Add index on proben_teilnehmer.status
-- Issue: #112
-- Description: Improve query performance for status-based ordering

CREATE INDEX IF NOT EXISTS idx_proben_teilnehmer_status ON proben_teilnehmer(status);
CREATE INDEX IF NOT EXISTS idx_proben_teilnehmer_probe_id ON proben_teilnehmer(probe_id);
