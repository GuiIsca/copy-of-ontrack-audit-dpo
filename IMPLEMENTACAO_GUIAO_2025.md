# Implementação do Guião AMONT 2025

## 📋 Resumo das Alterações

Este documento descreve as alterações implementadas para suportar o novo guião de auditoria AMONT 2025 com avaliação OK/KO e fotos obrigatórias.

---

## 🗄️ Base de Dados

### **1. Schema Atualizado** (`schema.sql`)

#### Novos ENUMs:
```sql
CREATE TYPE evaluation_type AS ENUM ('SCALE_1_5', 'OK_KO');
```

#### Tabela `audit_scores` atualizada:
```sql
- evaluation_type: ENUM (default 'SCALE_1_5')
- requires_photo: BOOLEAN (default FALSE)
- score: INTEGER CHECK (0-5) com validação:
  * SCALE_1_5: valores 1-5
  * OK_KO: valores 0 (KO) ou 1 (OK)
```

### **2. Novo Checklist AMONT 2025**

**Ficheiros criados:**
- `checklist_amont_2025.json` - JSON formatado (legível)
- `add_amont_checklist_2025.sql` - INSERT SQL pronto

**Estrutura:**
```
7 Secções Principais:
✅ 1. Exterior e Entrada da Loja (OBRIGATÓRIA)
   - A. Espaço Exterior (7 itens)
   - B. Zona de Acesso e Entrada (8 itens)
   - C. Sanitários (1 item)

2. Linha de Caixa
   - A. Atendimento (3 itens)
   - B. Organização e Comercial (3 itens)

✅ 3. Frescos (OBRIGATÓRIA)
   - 3.1 Frutas e Legumes (4 sub-grupos, 17 itens)
   - 3.2 Padaria (5 sub-grupos, 14 itens)
   - 3.3 Talho (4 sub-grupos, 25 itens)
   - 3.4 Peixaria (5 sub-grupos, 25 itens)
   - 3.5 Charcutaria (4 sub-grupos, 23 itens)
   - 3.6 Lacticínios/Congelados (2 sub-grupos, 9 itens)

4. Secos / Mercearia
   - 4 sub-grupos, 18 itens

5. Armazém / Backoffice
   - 1 sub-grupo, 8 itens

✅ 6. Promocional (OBRIGATÓRIA)
   - 1 sub-grupo, 3 itens

7. Pronto a Comer (Se aplicável)
   - 1 sub-grupo, 2 itens
```

**Total:** 
- **200+ critérios** de avaliação
- **Todos com avaliação OK/KO**
- **Foto obrigatória para KO** (exceto itens de atendimento)
- **Pesos diferenciados** (temperaturas e validades = weight 2)

### **3. Migration**

Ficheiro: `migration_001_ok_ko_support.sql`

Para aplicar em bases de dados existentes:
```bash
psql -U postgres -d ontrack_db -f server/db/migration_001_ok_ko_support.sql
```

---

## 📝 TypeScript Types

### **Novos Types** (`types.ts`)

```typescript
export enum EvaluationType {
  SCALE_1_5 = 'SCALE_1_5',
  OK_KO = 'OK_KO'
}

// Section agora tem is_mandatory
interface Section {
  is_mandatory?: boolean; // true para Exterior, Frescos, Promocional
}

// Criteria agora tem avaliação e foto obrigatória
interface Criteria {
  evaluation_type?: EvaluationType;
  requires_photo_on_ko?: boolean;
}

// AuditScore atualizado
interface AuditScore {
  score: number | null; // OK_KO: 0=KO, 1=OK | SCALE: 1-5
  evaluation_type?: EvaluationType;
  requires_photo?: boolean;
  photo_url?: string;
}
```

---

## 🚀 Como Aplicar as Alterações

### **Opção 1: Base de Dados Nova (Desenvolvimento)**

```bash
# Recriar base de dados com schema atualizado
psql -U postgres -c "DROP DATABASE ontrack_db;"
psql -U postgres -c "CREATE DATABASE ontrack_db;"
psql -U postgres -d ontrack_db -f server/db/schema.sql
psql -U postgres -d ontrack_db -f server/db/seed.sql
psql -U postgres -d ontrack_db -f server/db/add_amont_checklist_2025.sql
```

### **Opção 2: Base de Dados Existente (Produção)**

```bash
# Aplicar migration + novo checklist
psql -U postgres -d ontrack_db -f server/db/migration_001_ok_ko_support.sql
psql -U postgres -d ontrack_db -f server/db/add_amont_checklist_2025.sql
```

### **Opção 3: Docker Compose**

```bash
# Rebuild com dados novos
docker-compose down -v
docker-compose up -d
```

---

## 📊 Próximos Passos (TODO)

### ✅ **Concluído:**
1. ✅ Schema atualizado com evaluation_type e requires_photo
2. ✅ Checklist AMONT 2025 completo (7 secções, 200+ itens)
3. ✅ Types TypeScript atualizados
4. ✅ Migration SQL criada

### ⏳ **Pendente:**

#### **Backend:**
- [ ] Atualizar routes/audits.js para validar fotos obrigatórias
- [ ] Implementar cálculo de score por secção (média OK/KO)
- [ ] Validar secções obrigatórias antes de submeter
- [ ] Endpoint: `POST /api/audits/:id/validate-mandatory`

#### **Frontend:**
- [ ] Componente para avaliação OK/KO (botões em vez de slider)
- [ ] Upload de foto obrigatório quando KO
- [ ] Indicador visual de secções obrigatórias
- [ ] Bloqueio de submissão se secções obrigatórias incompletas
- [ ] Cálculo e exibição de score por secção

#### **Survey Aderente (Novo):**
- [ ] Criar componente SurveyAderente.tsx
- [ ] 6 perguntas com escala 1-5
- [ ] Campos de texto para observações
- [ ] Endpoint: `POST /api/surveys/aderente`

---

## 🎯 Regras de Negócio

### **Avaliação OK/KO:**
- **OK** = 1 (critério cumprido)
- **KO** = 0 (critério não cumprido)
- **Score da secção** = (soma de OKs / total de critérios) × 5

### **Fotos Obrigatórias:**
- Quando `requires_photo_on_ko = true` e `score = 0` (KO)
- Sistema deve bloquear se foto não for anexada
- Exceções: atendimento, simpatia, odor (não requerem foto)

### **Secções Obrigatórias:**
- Exterior e Entrada da Loja
- Frescos (todas as 6 subsecções)
- Promocional

Auditoria só pode ser submetida se todas as secções obrigatórias estiverem completas.

---

## 📸 Exemplo de Uso

### **Avaliar um critério OK/KO:**

```typescript
// Frontend
const handleEvaluation = (criteriaId: number, isOK: boolean) => {
  const score = isOK ? 1 : 0;
  
  if (!isOK && criteria.requires_photo_on_ko) {
    // Obrigar upload de foto
    setPhotoRequired(true);
  }
  
  saveScore({
    criteria_id: criteriaId,
    score: score,
    evaluation_type: 'OK_KO',
    photo_url: photoUrl // obrigatório se KO
  });
};
```

### **Calcular score da secção:**

```typescript
const calculateSectionScore = (scores: AuditScore[]): number => {
  const okCount = scores.filter(s => s.score === 1).length;
  const total = scores.length;
  return (okCount / total) * 5; // Converte para escala 1-5
};
```

---

## 🔍 Verificação

### **Testar Schema:**
```sql
-- Verificar que ENUM existe
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'evaluation_type'::regtype;

-- Verificar colunas novas
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'audit_scores' AND column_name IN ('evaluation_type', 'requires_photo');

-- Verificar checklist AMONT 2025
SELECT id, name, target_role FROM checklists WHERE id = 3;
```

### **Testar Insert:**
```sql
-- Teste OK/KO
INSERT INTO audit_scores (audit_id, criteria_id, score, evaluation_type, requires_photo)
VALUES (1, 10101, 0, 'OK_KO', true); -- KO com foto obrigatória

-- Teste SCALE 1-5
INSERT INTO audit_scores (audit_id, criteria_id, score, evaluation_type)
VALUES (1, 20001, 4, 'SCALE_1_5'); -- Score 4
```

---

## 📞 Suporte

Para questões sobre a implementação, consultar:
- Schema: `server/db/schema.sql`
- Checklist: `server/db/checklist_amont_2025.json`
- Types: `types.ts`
- Migration: `server/db/migration_001_ok_ko_support.sql`
