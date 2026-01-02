-- Migration: Add audit summary fields (final page)
-- This adds fields for the final summary page of audits (DOT/Team Leader/Admin/Amont)

ALTER TABLE audits
ADD COLUMN IF NOT EXISTS pontos_fortes TEXT,
ADD COLUMN IF NOT EXISTS pontos_melhorar TEXT,
ADD COLUMN IF NOT EXISTS acoes_criticas TEXT,
ADD COLUMN IF NOT EXISTS alertas TEXT;

-- Note: final_score and section scores are calculated on-the-fly,
-- no need to store them separately as they can be derived from audit_scores and section_evaluations
