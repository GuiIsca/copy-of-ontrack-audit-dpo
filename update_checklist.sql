UPDATE checklists SET sections = '[
  {
    "id": 201,
    "name": "1. Identificação",
    "orderindex": 1,
    "items": [
      {
        "id": 2101,
        "name": "Dados da Loja",
        "criteria": [
          {"id": 21001, "name": "Microsetor", "weight": 1},
          {"id": 21002, "name": "Loja visitada", "weight": 1}
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
          {"id": 22001, "name": "Limpeza e organização geral", "weight": 1},
          {"id": 22002, "name": "Disponibilidade de artigos (sem ruturas visíveis)", "weight": 1},
          {"id": 22003, "name": "Frescura e qualidade dos produtos", "weight": 1},
          {"id": 22004, "name": "Execução comercial (PLV, folheto, teatralização)", "weight": 1},
          {"id": 22005, "name": "Atendimento ao cliente observado", "weight": 1},
          {"id": 22006, "name": "Impressão geral da loja (experiência cliente)", "weight": 1}
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
          {"id": 23001, "name": "Pontos fortes que observou", "weight": 1},
          {"id": 23002, "name": "Pontos a melhorar", "weight": 1},
          {"id": 23003, "name": "Sugestões ao Aderente Visitado (opcional, mas útil)", "weight": 1}
        ]
      }
    ]
  }
]'::jsonb WHERE id = 2;
