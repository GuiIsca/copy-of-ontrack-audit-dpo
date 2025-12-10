-- Add evaluation_type and requires_photo columns to existing audit_scores table

-- Create evaluation_type enum if it doesn't exist (safe to run multiple times)
DO $$ BEGIN
    CREATE TYPE evaluation_type AS ENUM ('SCALE_1_5', 'OK_KO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add evaluation_type column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_scores' AND column_name = 'evaluation_type'
    ) THEN
        ALTER TABLE audit_scores 
        ADD COLUMN evaluation_type evaluation_type DEFAULT 'SCALE_1_5';
    END IF;
END $$;

-- Add requires_photo column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_scores' AND column_name = 'requires_photo'
    ) THEN
        ALTER TABLE audit_scores 
        ADD COLUMN requires_photo BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Update the check constraint to support OK_KO scores
ALTER TABLE audit_scores DROP CONSTRAINT IF EXISTS audit_scores_score_check;

ALTER TABLE audit_scores 
ADD CONSTRAINT audit_scores_score_check 
CHECK (score >= 0 AND score <= 5);

-- Add constraint for evaluation_type logic
DO $$
BEGIN
    -- Drop old constraint if exists
    ALTER TABLE audit_scores DROP CONSTRAINT IF EXISTS audit_scores_evaluation_check;
    
    -- Add new constraint
    ALTER TABLE audit_scores 
    ADD CONSTRAINT audit_scores_evaluation_check 
    CHECK (
        (evaluation_type = 'SCALE_1_5' AND score >= 1 AND score <= 5) OR
        (evaluation_type = 'OK_KO' AND (score IN (0, 1) OR score IS NULL)) OR
        (score IS NULL)
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Success message
SELECT 'Migration completed successfully!' AS status;
