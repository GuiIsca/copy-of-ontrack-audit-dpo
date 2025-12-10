-- Add section evaluations and action plans table

-- Section Evaluations Table
CREATE TABLE IF NOT EXISTS section_evaluations (
    id SERIAL PRIMARY KEY,
    audit_id INTEGER NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    section_id INTEGER NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    action_plan TEXT,
    responsible VARCHAR(255),
    due_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(audit_id, section_id)
);

-- Index for better performance
CREATE INDEX IF NOT EXISTS idx_section_evaluations_audit_id ON section_evaluations(audit_id);

-- Trigger for updated_at
CREATE TRIGGER update_section_evaluations_updated_at BEFORE UPDATE ON section_evaluations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Success message
SELECT 'Section evaluations table created successfully!' AS status;
