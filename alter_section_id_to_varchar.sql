-- Migration: Change section_id from INTEGER to VARCHAR to support subsections
-- This allows storing both numeric IDs (e.g., 3) and composite IDs (e.g., "3_3.1")
-- for FRESCOS subsections (3.1 Frutas e Legumes, 3.2 Padaria, etc.)

-- Step 1: Alter the column type
ALTER TABLE section_evaluations 
ALTER COLUMN section_id TYPE VARCHAR(50) USING section_id::VARCHAR;

-- The UNIQUE constraint (audit_id, section_id) and indexes will be preserved automatically
