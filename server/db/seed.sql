-- Seed Data for OnTrack Application

-- Define encoding para garantir acentos corretos
SET CLIENT_ENCODING TO 'UTF8';

-- NOTA IMPORTANTE:
-- A senha para TODOS os utilizadores abaixo é: 123456
-- O hash utilizado é compatível com bcrypt.

-- Insert Admin User
INSERT INTO users (id, email, fullname, roles, password_hash) VALUES
(1, 'admin@mousquetaires.com', 'Carlos Oliveira', ARRAY['ADMIN']::user_role[], '$2b$10$EoAOkNbEtoxIapQZIJK/guxAiyf7UBeawr7SRAyU9vnVEGntNxQhS');

-- Insert DOT Team Leader User
INSERT INTO users (id, email, fullname, roles, password_hash) VALUES
(2, 'leader@mousquetaires.com', 'Ana Costa', ARRAY['DOT_TEAM_LEADER']::user_role[], '$2b$10$EoAOkNbEtoxIapQZIJK/guxAiyf7UBeawr7SRAyU9vnVEGntNxQhS');

-- Insert DOT Operacional Users
INSERT INTO users (id, email, fullname, roles, dot_team_leader_id, assigned_stores, password_hash) VALUES
(3, 'dot1@mousquetaires.com', 'João Silva', ARRAY['DOT_OPERACIONAL']::user_role[], 2, ARRAY[1,2,3], '$2b$10$EoAOkNbEtoxIapQZIJK/guxAiyf7UBeawr7SRAyU9vnVEGntNxQhS'),
(4, 'dot2@mousquetaires.com', 'Pedro Martins', ARRAY['DOT_OPERACIONAL']::user_role[], 2, ARRAY[4,5,6], '$2b$10$EoAOkNbEtoxIapQZIJK/guxAiyf7UBeawr7SRAyU9vnVEGntNxQhS'),
(5, 'dot3@mousquetaires.com', 'Sofia Almeida', ARRAY['DOT_OPERACIONAL']::user_role[], 2, ARRAY[7,8], '$2b$10$EoAOkNbEtoxIapQZIJK/guxAiyf7UBeawr7SRAyU9vnVEGntNxQhS'),
(6, 'dot4@mousquetaires.com', 'Rui Santos', ARRAY['DOT_OPERACIONAL']::user_role[], 2, ARRAY[9,10], '$2b$10$EoAOkNbEtoxIapQZIJK/guxAiyf7UBeawr7SRAyU9vnVEGntNxQhS');

-- Insert Aderente Users 
INSERT INTO users (id, email, fullname, roles, password_hash) VALUES
(11, 'aderente1@intermarche.pt', 'Maria Santos', ARRAY['ADERENTE']::user_role[], '$2b$10$EoAOkNbEtoxIapQZIJK/guxAiyf7UBeawr7SRAyU9vnVEGntNxQhS'),
(12, 'aderente2@intermarche.pt', 'José Oliveira', ARRAY['ADERENTE']::user_role[], '$2b$10$EoAOkNbEtoxIapQZIJK/guxAiyf7UBeawr7SRAyU9vnVEGntNxQhS'),
(13, 'aderente3@intermarche.pt', 'Teresa Lima', ARRAY['ADERENTE']::user_role[], '$2b$10$EoAOkNbEtoxIapQZIJK/guxAiyf7UBeawr7SRAyU9vnVEGntNxQhS'),
(14, 'aderente4@intermarche.pt', 'Carlos Nunes', ARRAY['ADERENTE']::user_role[], '$2b$10$EoAOkNbEtoxIapQZIJK/guxAiyf7UBeawr7SRAyU9vnVEGntNxQhS'),
(15, 'aderente5@intermarche.pt', 'Ana Lopes', ARRAY['ADERENTE']::user_role[], '$2b$10$EoAOkNbEtoxIapQZIJK/guxAiyf7UBeawr7SRAyU9vnVEGntNxQhS'),
(16, 'aderente6@intermarche.pt', 'Miguel Tavares', ARRAY['ADERENTE']::user_role[], '$2b$10$EoAOkNbEtoxIapQZIJK/guxAiyf7UBeawr7SRAyU9vnVEGntNxQhS'),
(17, 'aderente7@intermarche.pt', 'Joana Pinto', ARRAY['ADERENTE']::user_role[], '$2b$10$EoAOkNbEtoxIapQZIJK/guxAiyf7UBeawr7SRAyU9vnVEGntNxQhS'),
(18, 'aderente8@intermarche.pt', 'Bruno Correia', ARRAY['ADERENTE']::user_role[], '$2b$10$EoAOkNbEtoxIapQZIJK/guxAiyf7UBeawr7SRAyU9vnVEGntNxQhS'),
(19, 'aderente9@intermarche.pt', 'Carla Gomes', ARRAY['ADERENTE']::user_role[], '$2b$10$EoAOkNbEtoxIapQZIJK/guxAiyf7UBeawr7SRAyU9vnVEGntNxQhS'),
(20, 'aderente10@intermarche.pt', 'Vasco Ribeiro', ARRAY['ADERENTE']::user_role[], '$2b$10$EoAOkNbEtoxIapQZIJK/guxAiyf7UBeawr7SRAyU9vnVEGntNxQhS');

-- Insert Stores
INSERT INTO stores (numero, nome, formato, area, telefone, dot_operacional_id, aderente_id, situacao_pdv, data_abertura, ultima_retoma, distrito, amplitude_horaria, morada, codigo_postal, conjugue_adh) VALUES
('06347', 'A DOS CUNHADOS', 'Super 1500', 1489.92, '241980190', 3, 11, 'Exploração', '2009-05-19', '2024-11-20', 'Lisboa', '09:00-21:00', 'Vale da Saúda', '2560-562', 'CECÍLIA ROBALO'),
('03622', 'ABRANTÉS', 'Super 2500', 3335.00, '241340810', 3, 12, 'Exploração', '1998-11-11', '2024-11-20', 'Santarém', '09:00-21:00', 'Rua das Escolas', '2200-061', 'ALDINA HENRIQUES'),
('03012', 'ABRIGADA', 'Super 1900', 976.00, '241736096', 3, 13, 'Exploração', '1999-01-25', '2024-11-20', 'Lisboa', '09:00-21:00', 'Lugar do Pinheiral', '2580-631', 'RICARDO DOMINGUES'),
('07502', 'ALUSTREL', 'Contact 600', 726.60, '284602030', 4, 14, 'Exploração', '1998-04-07', '2024-11-20', 'Beja', '09:00-21:00', 'Painel de Beja', '7600-073', NULL),
('06571', 'AREOSA', 'Super 2000', 1990.00, '258898090', 4, 15, 'Exploração', '2010-08-02', '2024-11-20', 'Viana Do Castelo', '09:00-21:00', 'BOUÇA DO ESPAÇO', '4800-580', NULL),
('07283', 'Loja Porto', 'Categoria 2', 2100.50, '223456789', 4, 16, 'Exploração', '2012-03-15', '2024-11-20', 'Porto', '08:30-21:30', 'Avenida da República, 1250', '4000-064', NULL),
('00119', 'Loja Coimbra', 'Categoria 3', 1650.00, '239876543', 5, 17, 'Exploração', '2014-07-22', '2024-11-20', 'Coimbra', '09:00-21:00', 'Rua Ferreira Borges, 890', '3000-180', NULL),
('01123', 'Loja Faro', 'Categoria 1', 1200.75, '289765432', 5, 18, 'Exploração', '2011-11-05', '2024-11-20', 'Faro', '08:00-22:00', 'Rua de Santo António, 456', '8000-271', NULL),
('00654', 'Loja Setúbal', 'Categoria 4', 2500.00, '265432198', 6, 19, 'Exploração', '2008-09-30', '2024-11-20', 'Setúbal', '09:00-21:00', 'Avenida Luísa Todi, 789', '2900-321', NULL),
('01100', 'Loja Guarda', 'Categoria 1', 950.50, '271234567', 6, 20, 'Exploração', '2013-01-10', '2024-11-20', 'Guarda', '08:30-20:30', 'Rua João de Deus, 320', '6300-751', NULL);

-- Insert Checklists
INSERT INTO checklists (id, name, target_role, sections) VALUES
(1, 'Auditoria DOT 2025 - Guião Completo', 'DOT_OPERACIONAL', 
'[
  {
    "id": 1,
    "name": "Exterior e Entrada da Loja",
    "orderindex": 1,
    "is_mandatory": true,
    "items": [
      {
        "id": 101,
        "name": "A. Espaço Exterior",
        "criteria": [
          {"id": 10101, "name": "Limpeza geral do exterior", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 10102, "name": "Envolvente do parque (folhas, lixo, vidros)", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 10103, "name": "Pavimento e sinalética visível", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 10104, "name": "Estado da insígnia (iluminação, danos, ferrugem)", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 10105, "name": "Carrinhos limpos e disponíveis", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 10106, "name": "Caixotes do lixo limpos e funcionais", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 10107, "name": "Anomalias de manutenção (paredes, ferrugem, lâmpadas)", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true}
        ]
      },
      {
        "id": 102,
        "name": "B. Zona de Acesso e Entrada",
        "criteria": [
          {"id": 10201, "name": "Vidros e portas automáticas limpas", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 10202, "name": "Comunicação exterior correta (PLV, cartazes)", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 10203, "name": "Presença de cartazes em suportes próprios (sem fita cola)", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 10204, "name": "Conforto na entrada (ausência de obstáculos, fluxo fácil)", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 10205, "name": "Entrada da loja limpa e apelativa", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 10206, "name": "Iluminação adequada", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 10207, "name": "Pavimento sem lixo/derrames", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 10208, "name": "Janelas e portas internas limpas", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true}
        ]
      },
      {
        "id": 103,
        "name": "C. Sanitários",
        "criteria": [
          {"id": 10301, "name": "Sanitários limpos e funcionais", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true}
        ]
      }
    ]
  },
  {
    "id": 2,
    "name": "Linha de Caixa",
    "orderindex": 2,
    "is_mandatory": false,
    "items": [
      {
        "id": 201,
        "name": "A. Atendimento",
        "criteria": [
          {"id": 20101, "name": "Número de caixas abertas vs afluência (com critério)", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 20102, "name": "Dimensionamento adequado (sobre ou subdimensionado)", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 20103, "name": "Sorriso / simpatia / acolhimento", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": false}
        ]
      },
      {
        "id": 202,
        "name": "B. Organização e Comercial",
        "criteria": [
          {"id": 20201, "name": "POS organizado", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 20202, "name": "Produtos impulsionadores disponíveis (tipo de artigo, preço, etc.)", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 20203, "name": "Comunicação visual coerente com Conceito", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true}
        ]
      }
    ]
  },
  {
    "id": 3,
    "name": "Frescos",
    "orderindex": 3,
    "is_mandatory": true,
    "items": [
      {
        "id": 301,
        "name": "3.1 Frutas e Legumes - A. Limpeza e Organização",
        "criteria": [
          {"id": 30101, "name": "Apresentação dos operadores com farda limpa", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 30102, "name": "Corredores limpos e sem obstáculos", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 30103, "name": "Pavimento sem lixo/derrames", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 30104, "name": "Iluminação adequada", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 30105, "name": "Zonas de trabalho limpas (cortes, equipas)", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 30106, "name": "Móveis e equipamentos em bom estado", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 30107, "name": "Equipamentos e balcões limpos", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 30108, "name": "Ausência de vassouras/pás de lixo à vista do cliente", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true}
        ]
      },
      {
        "id": 302,
        "name": "3.1 Frutas e Legumes - B. Oferta, Frescura e Qualidade",
        "criteria": [
          {"id": 30201, "name": "Qualidade e frescura (aspeto adequado, sem danos)", "weight": 2, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 30202, "name": "Gama disponível (diversidade e variedade)", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 30203, "name": "Sem ruturas visíveis", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 30204, "name": "Massificação adequada (abundância visual)", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 30205, "name": "Validades dentro do prazo", "weight": 2, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 30206, "name": "Respeito do FIFO", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 30207, "name": "Equipamentos de corte/preparação em boas condições", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true}
        ]
      },
      {
        "id": 303,
        "name": "3.1 Frutas e Legumes - C. Comercial",
        "criteria": [
          {"id": 30301, "name": "Preços corretos e visíveis", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 30302, "name": "Origem das frutas e legumes bem identificada (incluindo cartazes e/ou afichette)", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 30303, "name": "Teatralização correta", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 30304, "name": "Promoções destacadas (folheto, destaques)", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true}
        ]
      },
      {
        "id": 304,
        "name": "3.1 Frutas e Legumes - D. Experiência Cliente",
        "criteria": [
          {"id": 30401, "name": "Fluxo de cliente fluido", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 30402, "name": "Existência de sacos de pano/rede para compra", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true}
        ]
      },
      {
        "id": 305,
        "name": "3.2 Padaria - A. Processos & Conformidades",
        "criteria": [
          {"id": 30501, "name": "Plano de produção disponível", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 30502, "name": "Cumprimento do plano", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 30503, "name": "Rastreabilidade", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 30504, "name": "Informação sobre alergénios existente", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true}
        ]
      },
      {
        "id": 306,
        "name": "3.2 Padaria - B. Oferta & Variedade",
        "criteria": [
          {"id": 30601, "name": "Disponibilidade e variedade de artigos", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 30602, "name": "Exposição organizada", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true}
        ]
      },
      {
        "id": 307,
        "name": "3.2 Padaria - C. Higiene & Organização",
        "criteria": [
          {"id": 30701, "name": "Equipamentos limpos (forno, vitrinas)", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 30702, "name": "Higiene do balcão", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 30703, "name": "Apresentação dos operadores com farda limpa", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true}
        ]
      },
      {
        "id": 308,
        "name": "3.2 Padaria - D. Segurança & Higiene Cliente",
        "criteria": [
          {"id": 30801, "name": "Existência de luvas no móvel de auto-serviço", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 30802, "name": "Sinalética obrigatória de uso de luvas/pinça", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 30803, "name": "Sacos para pão disponíveis", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 30804, "name": "Sacos de pano/rede disponíveis para compra", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true}
        ]
      },
      {
        "id": 309,
        "name": "3.2 Padaria - E. Comercial & Experiência Cliente",
        "criteria": [
          {"id": 30901, "name": "Comunicação de preços correta", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 30902, "name": "Teatralização e destaques", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 30903, "name": "Fluxo de cliente fluido", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true}
        ]
      },
      {
        "id": 310,
        "name": "3.3 Talho - A. Higiene & Organização",
        "criteria": [
          {"id": 31001, "name": "Zonas de trabalho limpas", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 31002, "name": "Apresentação dos operadores com farda limpa", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 31003, "name": "Corredores limpos e sem obstáculos", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 31004, "name": "Pavimento sem lixo/derrames", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 31005, "name": "Iluminação adequada", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 31006, "name": "Balcões limpos", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 31007, "name": "Organização geral", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true}
        ]
      },
      {
        "id": 311,
        "name": "3.3 Talho - B. Oferta & Frescura",
        "criteria": [
          {"id": 31101, "name": "Sem ruturas", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 31102, "name": "Frescura e qualidade visível", "weight": 2, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 31103, "name": "Variedade de artigos", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 31104, "name": "Presença de preparados PDV", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 31105, "name": "Presença de elaborados PDV", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true}
        ]
      },
      {
        "id": 312,
        "name": "3.3 Talho - C. Temperaturas & Segurança Alimentar",
        "criteria": [
          {"id": 31201, "name": "Temperatura correta: Carne picada 0-2ºC", "weight": 2, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 31202, "name": "Temperatura correta: Outras carnes 0-4ºC", "weight": 2, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 31203, "name": "Validades e rótulos (LS)", "weight": 2, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 31204, "name": "Informação dos alergénios existente", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 31205, "name": "Origem da carne visível", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 31206, "name": "Preços da carne visíveis", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true}
        ]
      },
      {
        "id": 313,
        "name": "3.3 Talho - D. Atendimento & Comercial",
        "criteria": [
          {"id": 31301, "name": "Atendimento (simpatia, informação)", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": false},
          {"id": 31302, "name": "Filas de espera", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 31303, "name": "Teatralização e comunicação", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 31304, "name": "Destaques regionais", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 31305, "name": "Cross-selling", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": false}
        ]
      },
      {
        "id": 314,
        "name": "3.4 Peixaria - A. Higiene & Organização",
        "criteria": [
          {"id": 31401, "name": "Zonas de trabalho limpas", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 31402, "name": "Corredores limpos e sem obstáculos", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 31403, "name": "Pavimento sem lixo/derrames", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 31404, "name": "Iluminação adequada", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 31405, "name": "Balcões limpos", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 31406, "name": "Organização geral", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 31407, "name": "Ausência de água acumulada", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true}
        ]
      },
      {
        "id": 315,
        "name": "3.4 Peixaria - B. Oferta & Frescura",
        "criteria": [
          {"id": 31501, "name": "Sem ruturas", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 31502, "name": "Frescura e qualidade visível", "weight": 2, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 31503, "name": "Variedade de artigos", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 31504, "name": "Presença de preparados PDV", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 31505, "name": "Presença de elaborados PDV", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true}
        ]
      },
      {
        "id": 316,
        "name": "3.4 Peixaria - C. Temperaturas & Segurança Alimentar",
        "criteria": [
          {"id": 31601, "name": "Temperatura (móveis congelados: -18ºC)", "weight": 2, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 31602, "name": "Validades e rótulos", "weight": 2, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 31603, "name": "Preços corretos", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 31604, "name": "Zonas de captura e nome científico visíveis", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 31605, "name": "Gelo suficiente na bancada", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 31606, "name": "Ausência de gelo no chão", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 31607, "name": "Existência de separadores acrílicos/altura de gelo", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 31608, "name": "Crustáceos cozidos colocados no final da bancada, sem contacto com peixe fresco", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true}
        ]
      },
      {
        "id": 317,
        "name": "3.4 Peixaria - D. Atendimento & Comercial",
        "criteria": [
          {"id": 31701, "name": "Atendimento (simpatia, informação)", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": false},
          {"id": 31702, "name": "Filas de espera", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 31703, "name": "Teatralização e comunicação", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 31704, "name": "Destaques regionais", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 31705, "name": "Cross-selling", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": false}
        ]
      },
      {
        "id": 318,
        "name": "3.4 Peixaria - E. Experiência Cliente",
        "criteria": [
          {"id": 31801, "name": "Odor", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": false},
          {"id": 31802, "name": "Layout organizado", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 31803, "name": "Fluxo cliente fluido", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true}
        ]
      },
      {
        "id": 319,
        "name": "3.5 Charcutaria - A. Higiene & Organização",
        "criteria": [
          {"id": 31901, "name": "Zonas de trabalho limpas", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 31902, "name": "Prateleiras limpas", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 31903, "name": "Corredores limpos", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 31904, "name": "Pavimento sem lixo", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 31905, "name": "Iluminação adequada", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 31906, "name": "Balcões limpos", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 31907, "name": "Organização geral", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 31908, "name": "Apresentação operadores", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true}
        ]
      },
      {
        "id": 320,
        "name": "3.5 Charcutaria - B. Oferta & Frescura",
        "criteria": [
          {"id": 32001, "name": "Sem ruturas", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 32002, "name": "Frescura e qualidade visível", "weight": 2, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 32003, "name": "Variedade de artigos", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 32004, "name": "Preparados PDV (se aplicável)", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 32005, "name": "Elaborados PDV (se aplicável)", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true}
        ]
      },
      {
        "id": 321,
        "name": "3.5 Charcutaria - C. Temperaturas & Segurança Alimentar",
        "criteria": [
          {"id": 32101, "name": "Temperatura correta: Charcutaria 0-4ºC", "weight": 2, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 32102, "name": "Temperatura correta: Queijo fresco 0-6ºC", "weight": 2, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 32103, "name": "Temperatura correta: Queijo corte 0-8ºC", "weight": 2, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 32104, "name": "Validades e rótulos (LS)", "weight": 2, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 32105, "name": "Preços", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 32106, "name": "Informação alergénios existente", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true}
        ]
      },
      {
        "id": 322,
        "name": "3.5 Charcutaria - D. Atendimento & Comercial",
        "criteria": [
          {"id": 32201, "name": "Atendimento (simpatia, informação)", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": false},
          {"id": 32202, "name": "Filas de espera", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 32203, "name": "Teatralização", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 32204, "name": "Destaques regionais", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 32205, "name": "Cross-selling", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": false}
        ]
      },
      {
        "id": 323,
        "name": "3.6 Lacticínios/Congelados - A. Higiene & Organização",
        "criteria": [
          {"id": 32301, "name": "Corredores limpos", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 32302, "name": "Prateleiras limpas", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 32303, "name": "Pavimento limpo", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 32304, "name": "Iluminação adequada", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true}
        ]
      },
      {
        "id": 324,
        "name": "3.6 Lacticínios/Congelados - B. Oferta & Segurança",
        "criteria": [
          {"id": 32401, "name": "Sem ruturas", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 32402, "name": "Validades", "weight": 2, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 32403, "name": "Respeito do FIFO", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 32404, "name": "Ausência de produtos fora do frio há >30min", "weight": 2, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 32405, "name": "Expositores fechados (na generalidade)", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true}
        ]
      }
    ]
  },
  {
    "id": 4,
    "name": "Secos / Mercearia",
    "orderindex": 4,
    "is_mandatory": false,
    "items": [
      {
        "id": 401,
        "name": "A. Higiene e Organização",
        "criteria": [
          {"id": 40101, "name": "Corredores limpos", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 40102, "name": "Prateleiras limpas", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 40103, "name": "Pavimento limpo", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 40104, "name": "Iluminação adequada", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true}
        ]
      },
      {
        "id": 402,
        "name": "B. Disponibilidade",
        "criteria": [
          {"id": 40201, "name": "Linear sem ruturas", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 40202, "name": "Top 20 presentes (80% vendas)", "weight": 2, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 40203, "name": "Cumprimento FIFO", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 40204, "name": "Validades", "weight": 2, "evaluation_type": "OK_KO", "requires_photo_on_ko": true}
        ]
      },
      {
        "id": 403,
        "name": "C. Comercial",
        "criteria": [
          {"id": 40301, "name": "Etiquetas corretas", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 40302, "name": "Campanhas implementadas", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 40303, "name": "PLV atualizada", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 40304, "name": "Comunicação do Conceito", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 40305, "name": "Fluxo cliente fluido", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true}
        ]
      },
      {
        "id": 404,
        "name": "Topos (Módulo Obrigatório)",
        "criteria": [
          {"id": 40401, "name": "Produtos atrativos", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 40402, "name": "Artigos com impacto nas vendas", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 40403, "name": "Massificação correta", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 40404, "name": "Preços claros", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 40405, "name": "Promoções presentes", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true}
        ]
      }
    ]
  },
  {
    "id": 5,
    "name": "Armazém / Backoffice",
    "orderindex": 5,
    "is_mandatory": false,
    "items": [
      {
        "id": 501,
        "name": "Organização e Segurança",
        "criteria": [
          {"id": 50101, "name": "Limpeza geral", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 50102, "name": "Arrumação por zonas", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 50103, "name": "Níveis de stock adequados", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 50104, "name": "FIFO", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 50105, "name": "Câmaras frigoríficas limpas", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 50106, "name": "Temperaturas corretas", "weight": 2, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 50107, "name": "Paletes organizadas", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 50108, "name": "Segurança (ausência de riscos)", "weight": 2, "evaluation_type": "OK_KO", "requires_photo_on_ko": true}
        ]
      }
    ]
  },
  {
    "id": 6,
    "name": "Promocional",
    "orderindex": 6,
    "is_mandatory": true,
    "items": [
      {
        "id": 601,
        "name": "Execução Promocional",
        "criteria": [
          {"id": 60101, "name": "Artigos necessários para teatralização presentes", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 60102, "name": "Teatralização com massificação", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 60103, "name": "PLV de acordo com Conceito", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true}
        ]
      }
    ]
  },
  {
    "id": 7,
    "name": "Pronto a Comer (Se aplicável)",
    "orderindex": 7,
    "is_mandatory": false,
    "items": [
      {
        "id": 701,
        "name": "Informação e Sustentabilidade",
        "criteria": [
          {"id": 70101, "name": "Existência de informação ao Cliente para possibilidade de trazer recipiente próprio", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true},
          {"id": 70102, "name": "Informação dos alergénios existente", "weight": 1, "evaluation_type": "OK_KO", "requires_photo_on_ko": true}
        ]
      }
    ]
  }
]'::jsonb),
(2, 'Survey Aderente – Visitas às lojas', 'ADERENTE', 
'[
  {
    "id": 201,
    "name": "1. Identificação",
    "orderindex": 1,
    "items": [
      {
        "id": 2101,
        "name": "Dados da Loja",
        "criteria": [
          {"id": 21001, "name": "Microsetor", "weight": 1, "type": "dropdown", "options": []},
          {"id": 21002, "name": "Loja visitada", "weight": 1, "type": "dropdown", "options": []}
        ]
      }
    ]
  },
  {
    "id": 202,
    "name": "2. Avaliação Geral da Loja",
    "orderindex": 2,
    "items": [
      {
        "id": 2201,
        "name": "Escala 1 a 5 (1 = Muito Mau | 5 = Excelente)",
        "criteria": [
          {"id": 22001, "name": "Limpeza e organização geral", "weight": 1, "type": "rating"},
          {"id": 22002, "name": "Disponibilidade de artigos (sem ruturas visíveis)", "weight": 1, "type": "rating"},
          {"id": 22003, "name": "Frescura e qualidade dos produtos", "weight": 1, "type": "rating"},
          {"id": 22004, "name": "Execução comercial (PLV, folheto, teatralização)", "weight": 1, "type": "rating"},
          {"id": 22005, "name": "Atendimento ao cliente observado", "weight": 1, "type": "rating"},
          {"id": 22006, "name": "Impressão geral da loja (experiência cliente)", "weight": 1, "type": "rating"}
        ]
      }
    ]
  },
  {
    "id": 203,
    "name": "3. Destaques da Loja",
    "orderindex": 3,
    "items": [
      {
        "id": 2301,
        "name": "Observações",
        "criteria": [
          {"id": 23001, "name": "Pontos fortes que observou", "weight": 1, "type": "text"},
          {"id": 23002, "name": "Pontos a melhorar", "weight": 1, "type": "text"},
          {"id": 23003, "name": "Sugestões ao Aderente Visitado (opcional, mas útil)", "weight": 1, "type": "text"}
        ]
      }
    ]
  }
]'::jsonb);

-- Insert Sample Audits
/*
INSERT INTO audits (id, store_id, dot_user_id, checklist_id, dtstart, status, created_by) VALUES
(1, 1, 3, 1, '2025-12-10 09:00:00', 'SCHEDULED', 2),
(2, 2, 3, 1, '2025-12-12 10:00:00', 'SCHEDULED', 2),
(3, 4, 4, 1, '2025-12-11 14:00:00', 'SCHEDULED', 2);

-- Insert Sample Visits
INSERT INTO visits (id, store_id, user_id, type, title, description, dtstart, dtend, status, created_by) VALUES
(1, 5, 4, 'FORMACAO', 'Formação Segurança Alimentar', 'Sessão de formação sobre boas práticas', '2025-12-15 09:00:00', '2025-12-15 12:00:00', 'SCHEDULED', 2),
(2, 7, 5, 'ACOMPANHAMENTO', 'Acompanhamento Pós-Auditoria', 'Verificação de implementação de ações', '2025-12-20 10:00:00', '2025-12-20 16:00:00', 'SCHEDULED', 2);
*/

-- Reset sequences
SELECT setval('users_id_seq', 20, true);
SELECT setval('stores_id_seq', 10, true);
SELECT setval('checklists_id_seq', 2, true);
SELECT setval('audits_id_seq', 3, true);
SELECT setval('visits_id_seq', 2, true);