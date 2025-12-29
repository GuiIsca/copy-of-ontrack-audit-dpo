-- Idempotent migration for store layouts
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'store_layout_type') THEN
        CREATE TYPE store_layout_type AS ENUM ('PLANTA_LOJA', 'LAYOUT_FORMATO');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS store_layouts (
    id SERIAL PRIMARY KEY,
    store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    layout_type store_layout_type NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100),
    uploaded_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_store_layouts_store_id ON store_layouts(store_id);
CREATE INDEX IF NOT EXISTS idx_store_layouts_type ON store_layouts(layout_type);
CREATE INDEX IF NOT EXISTS idx_store_layouts_uploaded_by ON store_layouts(uploaded_by);

-- Trigger
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_store_layouts_updated_at'
    ) THEN
        CREATE TRIGGER update_store_layouts_updated_at BEFORE UPDATE ON store_layouts
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
