-- OnTrack Database Schema

-- Define encoding para garantir acentos corretos
SET CLIENT_ENCODING TO 'UTF8';

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Roles Enum
CREATE TYPE user_role AS ENUM ('ADMIN', 'DOT_TEAM_LEADER', 'DOT_OPERACIONAL', 'ADERENTE', 'AMONT');

-- Audit Status Enum
CREATE TYPE audit_status AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'REPLACED');

-- Visit Type Enum
CREATE TYPE visit_type AS ENUM ('AUDITORIA', 'OUTROS');

-- Action Status Enum
CREATE TYPE action_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- Action Responsible Enum
CREATE TYPE action_responsible AS ENUM ('DOT_OPERACIONAL', 'ADERENTE', 'BOTH');

-- Evaluation Type Enum
CREATE TYPE evaluation_type AS ENUM ('SCALE_1_5', 'OK_KO');

-- Analytics Period Enum
CREATE TYPE analytics_period AS ENUM ('DAILY', 'MONTHLY');

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    fullname VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    roles user_role[] NOT NULL,
    dot_team_leader_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    assigned_stores INTEGER[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stores Table
CREATE TABLE stores (
    id SERIAL PRIMARY KEY,
    numero VARCHAR(50),
    nome VARCHAR(255),
    formato VARCHAR(100),
    area DECIMAL(10, 2),
    telefone VARCHAR(20),
    dot_operacional_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    aderente_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    situacao_pdv VARCHAR(50),
    data_abertura DATE,
    ultima_retoma DATE,
    distrito VARCHAR(100),
    amplitude_horaria VARCHAR(50),
    morada VARCHAR(255),
    codigo_postal VARCHAR(10),
    conjugue_adh VARCHAR(255),
    lugares_estacionamento INTEGER,
    pac BOOLEAN,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Checklists Table
CREATE TABLE checklists (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    target_role user_role NOT NULL,
    sections JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audits Table
CREATE TABLE audits (
    id SERIAL PRIMARY KEY,
    store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    dot_operacional_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    checklist_id INTEGER REFERENCES checklists(id) ON DELETE SET NULL,
    dtstart TIMESTAMP NOT NULL,
    dtend TIMESTAMP,
    status audit_status DEFAULT 'SCHEDULED',
    final_score DECIMAL(5, 2),
    created_by INTEGER NOT NULL REFERENCES users(id),
    visit_source_type VARCHAR(50),
    pontos_fortes TEXT,
    pontos_melhorar TEXT,
    acoes_criticas TEXT,
    alertas TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Visits Table (non-audit visits)
CREATE TABLE visits (
    id SERIAL PRIMARY KEY,
    store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type visit_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    dtstart TIMESTAMP NOT NULL,
    dtend TIMESTAMP,
    status audit_status DEFAULT 'SCHEDULED',
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Scores Table
CREATE TABLE audit_scores (
    id SERIAL PRIMARY KEY,
    audit_id INTEGER NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    criteria_id INTEGER NOT NULL,
    score INTEGER CHECK (score >= 0 AND score <= 5),
    evaluation_type evaluation_type DEFAULT 'SCALE_1_5',
    comment TEXT,
    photo_url TEXT,
    requires_photo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(audit_id, criteria_id),
    CHECK (
        (evaluation_type = 'SCALE_1_5' AND score >= 1 AND score <= 5) OR
        (evaluation_type = 'OK_KO' AND score IN (0, 1))
    )
);

-- Action Plans Table
CREATE TABLE action_plans (
    id SERIAL PRIMARY KEY,
    audit_id INTEGER NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
    section_id VARCHAR(50),
    criteria_id INTEGER,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    responsible action_responsible NOT NULL,
    due_date TIMESTAMP NOT NULL,
    status action_status DEFAULT 'PENDING',
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    completed_date TIMESTAMP,
    aderente_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_by INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Comments Table
CREATE TABLE audit_comments (
    id SERIAL PRIMARY KEY,
    audit_id INTEGER NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Section Evaluations Table
-- section_id can be a number (for regular sections) or a string like "3_3.1" (for subsections within FRESCOS)
CREATE TABLE section_evaluations (
    id SERIAL PRIMARY KEY,
    audit_id INTEGER NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    section_id VARCHAR(50) NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    action_plan TEXT,
    responsible VARCHAR(255),
    due_date DATE,
    aderente_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(audit_id, section_id)
);

-- Admin Contact Departments Parametrizable Table
CREATE TABLE admin_contact_departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Aderente Contact Admin Messages Table
CREATE TABLE aderente_contact_messages (
    id SERIAL PRIMARY KEY,
    aderente_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    department_id INTEGER NOT NULL REFERENCES admin_contact_departments(id) ON DELETE RESTRICT,
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Specialist Areas Enum
CREATE TYPE specialist_area AS ENUM ('Frutas e Legumes', 'Padaria Pastelaria LS', 'Charcutaria e Queijos', 'Talho', 'Peixaria', 'Pronto a Comer');

-- Specialist Manuals Table
CREATE TABLE specialist_manuals (
    id SERIAL PRIMARY KEY,
    area specialist_area NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    master_user_manual BOOLEAN DEFAULT FALSE,
    uploaded_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Specialist Manual Access Permissions (tracks which roles can access which areas)
CREATE TABLE specialist_manual_permissions (
    id SERIAL PRIMARY KEY,
    area specialist_area NOT NULL,
    roles user_role[] NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(area)
);

-- Folhetos (Leaflets) Table
CREATE TABLE folhetos (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    uploaded_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Estudo de Mercado (Market Study) Table
CREATE TABLE estudo_mercado (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    uploaded_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Store Layout Types Enum
CREATE TYPE store_layout_type AS ENUM ('PLANTA_LOJA', 'LAYOUT_FORMATO');

-- Store Layouts Table (Planta da Loja / Layout do Formato)
CREATE TABLE store_layouts (
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

-- Indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_roles ON users USING GIN(roles);
CREATE INDEX idx_stores_dot_operacional_id ON stores(dot_operacional_id);
CREATE INDEX idx_stores_aderente_id ON stores(aderente_id);
CREATE INDEX idx_audits_store_id ON audits(store_id);
CREATE INDEX idx_audits_dot_operacional_id ON audits(dot_operacional_id);
CREATE INDEX idx_audits_status ON audits(status);
CREATE INDEX idx_audits_dtstart ON audits(dtstart);
CREATE INDEX idx_visits_store_id ON visits(store_id);
CREATE INDEX idx_visits_user_id ON visits(user_id);
CREATE INDEX idx_visits_type ON visits(type);
CREATE INDEX idx_visits_dtstart ON visits(dtstart);
CREATE INDEX idx_audit_scores_audit_id ON audit_scores(audit_id);
CREATE INDEX idx_audit_scores_evaluation_type ON audit_scores(evaluation_type);
CREATE INDEX idx_action_plans_audit_id ON action_plans(audit_id);
CREATE INDEX idx_action_plans_status ON action_plans(status);
CREATE INDEX idx_audit_comments_audit_id ON audit_comments(audit_id);
CREATE INDEX idx_section_evaluations_audit_id ON section_evaluations(audit_id);
CREATE INDEX idx_aderente_contact_messages_aderente_id ON aderente_contact_messages(aderente_id);
CREATE INDEX idx_aderente_contact_messages_read ON aderente_contact_messages(read);
CREATE INDEX idx_specialist_manuals_area ON specialist_manuals(area);
CREATE INDEX idx_specialist_manuals_uploaded_by ON specialist_manuals(uploaded_by);
CREATE INDEX idx_specialist_manual_permissions_area ON specialist_manual_permissions(area);
CREATE INDEX idx_folhetos_uploaded_by ON folhetos(uploaded_by);
CREATE INDEX idx_estudo_mercado_uploaded_by ON estudo_mercado(uploaded_by);
CREATE INDEX idx_store_layouts_store_id ON store_layouts(store_id);
CREATE INDEX idx_store_layouts_type ON store_layouts(layout_type);
CREATE INDEX idx_store_layouts_uploaded_by ON store_layouts(uploaded_by);

-- Analytics KPIs Table (daily and monthly snapshots)
CREATE TABLE analytics_kpis (
    id SERIAL PRIMARY KEY,
    period_type analytics_period NOT NULL,
    period_date DATE NOT NULL,
    store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
    vendas_total NUMERIC(18, 2),
    vendas_evolucao_pct NUMERIC(7, 2),
    variacao_absoluta_eur NUMERIC(18, 2),
    seca_pct NUMERIC(7, 2),
    fresca_pct NUMERIC(7, 2),
    cesto_medio NUMERIC(18, 2),
    clientes_total INTEGER,
    margem_pct NUMERIC(7, 2),
    stock_total NUMERIC(18, 2),
    produtividade NUMERIC(18, 4),
    custos_pessoal NUMERIC(18, 2),
    margem_seminet_pct NUMERIC(7, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (period_type, period_date, store_id)
);

CREATE TABLE analytics_imports (
    id SERIAL PRIMARY KEY,
    period_type analytics_period NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    source VARCHAR(100),
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    payload JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_kpis_period ON analytics_kpis(period_type, period_date);
CREATE INDEX idx_analytics_kpis_store ON analytics_kpis(store_id);
CREATE INDEX idx_analytics_imports_period ON analytics_imports(period_type, period_start, period_end);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audits_updated_at BEFORE UPDATE ON audits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_visits_updated_at BEFORE UPDATE ON visits
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_action_plans_updated_at BEFORE UPDATE ON action_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_section_evaluations_updated_at BEFORE UPDATE ON section_evaluations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_contact_departments_updated_at BEFORE UPDATE ON admin_contact_departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_aderente_contact_messages_updated_at BEFORE UPDATE ON aderente_contact_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_specialist_manuals_updated_at BEFORE UPDATE ON specialist_manuals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_specialist_manual_permissions_updated_at BEFORE UPDATE ON specialist_manual_permissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_folhetos_updated_at BEFORE UPDATE ON folhetos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_estudo_mercado_updated_at BEFORE UPDATE ON estudo_mercado
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_store_layouts_updated_at BEFORE UPDATE ON store_layouts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analytics_kpis_updated_at BEFORE UPDATE ON analytics_kpis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_analytics_imports_updated_at BEFORE UPDATE ON analytics_imports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ADMIN user seed with password '123456'
--INSERT INTO users (id, email, fullname, roles) VALUES
--(1, 'admin@intermarche.pt', 'Master Administrator', ARRAY['ADMIN']::user_role[]);
--UPDATE users SET password_hash = '$2b$10$EoAOkNbEtoxIapQZIJK/guxAiyf7UBeawr7SRAyU9vnVEGntNxQhS' WHERE email = 'admin@intermarche.pt';

-- Seed default departments
INSERT INTO admin_contact_departments (name) VALUES
('Marketing'),
('Comércio'),
('Compras'),
('Transformação e Processos'),
('Conceito'),
('Gestão Aval')
ON CONFLICT (name) DO NOTHING;

-- Seed specialist manual permissions (all areas available to all roles except AMONT)
INSERT INTO specialist_manual_permissions (area, roles) VALUES
('Frutas e Legumes', ARRAY['ADMIN', 'DOT_TEAM_LEADER', 'DOT_OPERACIONAL', 'ADERENTE']::user_role[]),
('Padaria Pastelaria LS', ARRAY['ADMIN', 'DOT_TEAM_LEADER', 'DOT_OPERACIONAL', 'ADERENTE']::user_role[]),
('Charcutaria e Queijos', ARRAY['ADMIN', 'DOT_TEAM_LEADER', 'DOT_OPERACIONAL', 'ADERENTE']::user_role[]),
('Talho', ARRAY['ADMIN', 'DOT_TEAM_LEADER', 'DOT_OPERACIONAL', 'ADERENTE']::user_role[]),
('Peixaria', ARRAY['ADMIN', 'DOT_TEAM_LEADER', 'DOT_OPERACIONAL', 'ADERENTE']::user_role[]),
('Pronto a Comer', ARRAY['ADMIN', 'DOT_TEAM_LEADER', 'DOT_OPERACIONAL', 'ADERENTE']::user_role[])
ON CONFLICT (area) DO NOTHING;