-- Script para reinserir dados base (seed data)
-- Limpa e reinsere: users, stores, checklists

SET CLIENT_ENCODING TO 'UTF8';

-- 1. Limpar dados existentes (mantém estrutura)
TRUNCATE TABLE comments CASCADE;
TRUNCATE TABLE section_evaluations CASCADE;
TRUNCATE TABLE audit_scores CASCADE;
TRUNCATE TABLE audits CASCADE;
TRUNCATE TABLE visits CASCADE;
TRUNCATE TABLE stores CASCADE;
TRUNCATE TABLE users CASCADE;

-- Não precisamos truncar checklists porque vêm do JSON no backend

-- 2. Resetar sequences
ALTER SEQUENCE users_id_seq RESTART WITH 1;
ALTER SEQUENCE stores_id_seq RESTART WITH 1;
ALTER SEQUENCE audits_id_seq RESTART WITH 1;
ALTER SEQUENCE visits_id_seq RESTART WITH 1;
ALTER SEQUENCE audit_scores_id_seq RESTART WITH 1;
ALTER SEQUENCE section_evaluations_id_seq RESTART WITH 1;
ALTER SEQUENCE comments_id_seq RESTART WITH 1;

-- Mensagem
SELECT 'Dados limpos! Agora vais precisar reiniciar o backend para carregar os dados do seed.sql' AS status;
