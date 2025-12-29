# Importar CSV (TL/Admin)

- Importa tarefas dos DOTs: Auditoria ou Visitas (Formação/Acompanhamento/Outros).
- Colunas: tipo; dot; numero_loja; data (DD/MM/YYYY); hora_inicio; hora_fim; titulo; texto.
- Para Auditoria: só dtstart; para Visitas: exige hora_fim e valida dtstart<dtend.
- Verifica DOT por email e loja por número; valida loja atribuída ao DOT.
- Evita duplicados no mesmo dia; auditorias SCHEDULED existentes podem ser marcadas REPLACED.
- Resultado mostra criados e lista de erros (exportável).
- Disponível em TL dashboard; Admin também pode usar.
