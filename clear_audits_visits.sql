-- Script para limpar auditorias e visitas de teste
-- Mantém users, stores, checklists

SET CLIENT_ENCODING TO 'UTF8';

-- Limpar tabelas relacionadas primeiro (por causa das foreign keys)
TRUNCATE TABLE section_evaluations CASCADE;
TRUNCATE TABLE audit_scores CASCADE;
TRUNCATE TABLE comments CASCADE;
TRUNCATE TABLE audits CASCADE;
TRUNCATE TABLE visits CASCADE;

-- Resetar as sequences (IDs voltam a começar do 1)
ALTER SEQUENCE audits_id_seq RESTART WITH 1;
ALTER SEQUENCE visits_id_seq RESTART WITH 1;
ALTER SEQUENCE audit_scores_id_seq RESTART WITH 1;
ALTER SEQUENCE section_evaluations_id_seq RESTART WITH 1;
ALTER SEQUENCE comments_id_seq RESTART WITH 1;

-- Mensagem de sucesso
SELECT 'Base de dados limpa! Auditorias e visitas removidas.' AS status;
