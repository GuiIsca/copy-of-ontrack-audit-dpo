-- Migration: Add OK/KO Evaluation Support
-- Date: 2025-12-09
-- Description: Adiciona suporte para avaliação OK/KO e fotos obrigatórias

-- 1. Adicionar novo ENUM para tipo de avaliação
CREATE TYPE evaluation_type AS ENUM ('SCALE_1_5', 'OK_KO');

-- 2. Adicionar novas colunas à tabela audit_scores
ALTER TABLE audit_scores 
  ADD COLUMN evaluation_type evaluation_type DEFAULT 'SCALE_1_5',
  ADD COLUMN requires_photo BOOLEAN DEFAULT FALSE;

-- 3. Atualizar constraint de score para suportar OK/KO (0 ou 1) e SCALE (1-5)
ALTER TABLE audit_scores 
  DROP CONSTRAINT IF EXISTS audit_scores_score_check,
  ADD CONSTRAINT audit_scores_score_check CHECK (score >= 0 AND score <= 5),
  ADD CONSTRAINT audit_scores_evaluation_check CHECK (
    (evaluation_type = 'SCALE_1_5' AND score >= 1 AND score <= 5) OR
    (evaluation_type = 'OK_KO' AND score IN (0, 1)) OR
    (score IS NULL)
  );

-- 4. Adicionar índice para melhorar performance
CREATE INDEX idx_audit_scores_evaluation_type ON audit_scores(evaluation_type);

-- 5. Adicionar campo is_mandatory ao JSONB sections (via aplicação)
-- Nota: As secções JSONB já suportam campos adicionais sem alteração de schema
-- O campo 'is_mandatory' será adicionado diretamente nos novos checklists

COMMENT ON COLUMN audit_scores.evaluation_type IS 'Tipo de avaliação: SCALE_1_5 (1-5) ou OK_KO (0=KO, 1=OK)';
COMMENT ON COLUMN audit_scores.requires_photo IS 'Se true, foto é obrigatória quando score = KO (0)';
