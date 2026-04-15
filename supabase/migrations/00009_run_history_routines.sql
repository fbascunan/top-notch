-- Migration: Add routine-related columns to run_history
-- Supports Claude Code Routines trigger (M24) and webhook correlation (M25)

-- correlation_id: UUID linking API trigger → routine prompt → commit message → webhook
-- Unique where not null to prevent duplicate processing
ALTER TABLE run_history ADD COLUMN correlation_id TEXT;
CREATE UNIQUE INDEX idx_run_history_correlation_id ON run_history(correlation_id) WHERE correlation_id IS NOT NULL;

-- trigger_source: how the run was initiated ('manual' = website button, 'scheduled' = cron routine)
ALTER TABLE run_history ADD COLUMN trigger_source TEXT NOT NULL DEFAULT 'manual';
