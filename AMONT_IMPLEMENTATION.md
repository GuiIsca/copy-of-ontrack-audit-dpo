# Implementação do Perfil AMONT

## Resumo
Foi implementado um novo perfil de utilizador **AMONT** no sistema OnTrack Audit DPO. Este perfil é um auditor independente que não pertence à hierarquia organizacional existente (DOT Team Leader > DOT Operacional > Aderente).

## Características do Perfil AMONT

### Permissões
- ✅ Pode criar auditorias em qualquer loja (sem restrições de atribuição)
- ✅ Pode editar, submeter e eliminar apenas as suas próprias auditorias
- ✅ Visualiza apenas as suas próprias auditorias no dashboard
- ✅ Apenas o Admin e o próprio utilizador AMONT podem ver as suas auditorias
- ❌ Não tem acesso a funcionalidades de gestão ou supervisão
- ❌ Não pertence à hierarquia DOT Team Leader/DOT Operacional

### Dashboard
O dashboard do AMONT (`/amont/dashboard`) apresenta:
- Estatísticas das suas auditorias (Total, Em Progresso, Submetidas, Finalizadas)
- Vista em calendário ou lista
- Navegação para criar novas auditorias
- Acesso direto às suas auditorias para edição/visualização

## Alterações Implementadas

### 1. Definição do Role (`types.ts`, `schema.sql`)
```typescript
enum UserRole {
  // ... outros roles
  AMONT = 'AMONT'
}
```

### 2. Permissões (`utils/permissions.ts`)
Funções adicionadas/atualizadas:
- `canCreateAudit()` - Inclui AMONT
- `canEditAudit()` - AMONT pode editar suas próprias auditorias
- `canDeleteAudit()` - AMONT pode eliminar suas próprias auditorias
- `canSubmitAudit()` - AMONT pode submeter suas próprias auditorias
- `canAccessAmontDashboard()` - Nova função de acesso
- `canViewAmontAudit()` - Controla visibilidade (Admin + creator)
- `getDefaultDashboard()` - Retorna `/amont/dashboard` para AMONT

### 3. Dashboard (`pages/AmontDashboard.tsx`)
Novo componente com:
- Listagem de auditorias criadas pelo utilizador
- Vista calendário usando `MonthPlanner`
- Navegação para criação de auditorias (`/amont/new-audit`)
- Navegação para edição/visualização de auditorias

### 4. Rotas (`App.tsx`)
Rotas adicionadas:
- `/amont/dashboard` - Dashboard principal
- `/amont/new-audit` - Criação de auditoria
- `/amont/execute/:id` - Edição de auditoria
- `/amont/audit/:id` - Visualização de auditoria

### 5. Gestão de Utilizadores (`pages/AdminDashboard.tsx`)
- Formulário de criação simplificado (sem hierarquia)
- Secção independente "AMONT - Auditores Independentes" na visualização hierárquica
- Estatística no overview (card adicional)

### 6. Base de Dados
Script SQL criado: `add_amont_role.sql`
```sql
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'AMONT';
```

## Como Usar

### Login Rápido (Demo)
Na página de login existe um botão de acesso rápido:
- 🔍 AMONT (Auditor Independente)
- Email: `amont@mousquetaires.com`
- Password: `123456`

### Criar Utilizador AMONT
1. Aceder ao Admin Dashboard
2. Ir ao separador "Utilizadores"
3. Na secção "Adicionar Novo Utilizador", usar o formulário "Novo AMONT"
4. Preencher nome e email
5. Clicar "Criar"

### Como AMONT
1. Login com credenciais AMONT
2. Redirecionamento automático para `/amont/dashboard`
3. Clicar "Nova Auditoria" para criar
4. Selecionar qualquer loja disponível
5. Executar auditoria normalmente
6. Apenas este utilizador e Admin podem ver/editar a auditoria

## Migração da Base de Dados

O role AMONT já está incluído no [schema.sql](server/db/schema.sql) e o utilizador de teste já está no [seed.sql](server/db/seed.sql).

### Recriar Base de Dados
Para aplicar todas as alterações:
```bash
docker compose down -v
docker compose up -d --build
```

Após isso, pode fazer login com:
- Email: `amont@mousquetaires.com`
- Password: `123456`

## Segurança

### Frontend
- Verificação de permissões via `canAccessAmontDashboard()`
- Rotas protegidas com `ProtectedRoute`
- Filtragem de auditorias por `createdBy`

### Backend
⚠️ **Nota**: O sistema atual não possui middleware de autenticação robusto no backend. A segurança depende principalmente das verificações no frontend. Para produção, recomenda-se:
- Implementar middleware de autenticação em todas as rotas API
- Validar roles no servidor antes de retornar/modificar dados
- Implementar tokens JWT com refresh tokens
- Adicionar rate limiting e proteção CSRF

## Diferenças em Relação a Outros Perfis

| Característica | DOT Operacional | AMONT |
|----------------|-----------------|-------|
| Hierarquia | Subordinado a DOT Team Leader | Independente |
| Lojas | Apenas lojas atribuídas | Qualquer loja |
| Visibilidade Auditorias | Supervisor pode ver | Apenas Admin pode ver |
| Gestão | Atribuição de lojas | Sem atribuição |
| Dashboard | `/dot-operacional/dashboard` | `/amont/dashboard` |

## Testes Recomendados

1. ✅ Criar utilizador AMONT via Admin Dashboard
2. ✅ Login como AMONT e verificar redirecionamento para dashboard correto
3. ✅ Criar auditoria em loja aleatória
4. ✅ Verificar que apenas o AMONT e Admin veem a auditoria
5. ✅ Editar e submeter auditoria
6. ✅ Verificar que DOT Team Leader não vê auditorias AMONT
7. ✅ Tentar aceder a auditorias de outros utilizadores (deve falhar)

## Ficheiros Modificados

### Frontend
- `types.ts` - Adicionado enum UserRole.AMONT
- `utils/permissions.ts` - Permissões AMONT
- `utils/auth.ts` - (Nenhuma alteração necessária, usa getDefaultDashboard())
- `App.tsx` - Rotas AMONT
- `pages/AmontDashboard.tsx` - **NOVO** Dashboard AMONT
- `pages/AdminDashboard.tsx` - Gestão de utilizadores AMONT

### Backend
- `server/db/schema.sql` - Adicionado AMONT ao enum user_role
- `server/db/seed.sql` - Adicionado utilizador AMONT de teste

### Nenhuma alteração necessária em:
- `server/routes/audits.js` - Filtragem já funciona por userId
- `server/routes/visits.js` - Não usado por AMONT
- `services/dbAdapter.ts` - Lógica genérica já funciona
- `services/api.ts` - Nenhuma alteração necessária

## Próximos Passos (Opcional)

1. Implementar middleware de autenticação no backend
2. Adicionar campo `visit_source_type = 'AMONT_AUDIT'` para distinguir auditorias
3. Criar relatórios específicos para auditorias AMONT
4. Adicionar notificações para Admin quando AMONT submete auditoria
5. Implementar sistema de aprovação para auditorias AMONT

## Suporte

Para questões ou problemas, contactar a equipa de desenvolvimento.
