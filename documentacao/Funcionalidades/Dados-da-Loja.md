# Dados da Loja

## Descrição
Página que permite visualizar informações detalhadas sobre uma loja, incluindo dados operacionais, contactos da equipa e estrutura.

## Perfis com Acesso
- ✅ Admin
- ✅ DOT Team Leader
- ✅ DOT Operacional
- ✅ Amont
- ❌ Aderente (sem acesso)

## Campos Apresentados

### Loja
- **Nome** - Nome da loja (proveniente da BD)
- **Morada** - Morada completa (proveniente da BD)
- **Código Postal** - Código postal (proveniente da BD)
- **Distrito** - Distrito onde se localiza (proveniente da BD)
- **Telefone da loja** - Contacto telefónico (proveniente da BD, **editável**)
- **Amplitude Horária** - Horário de funcionamento (proveniente da BD)
- **Data de abertura** - Data em que a loja foi inaugurada (proveniente da BD)

### Equipa e Contactos
- **Aderente** - Nome e email do aderente responsável (proveniente da BD)
- **DOT Operacional** - Nome e email do DOT Operacional atribuído (proveniente da BD)
- **DOT Team Leader** - Nome e email do DOT Team Leader responsável (proveniente da BD)
- **Cônjuge** - Nome do cônjuge/sócio (proveniente da BD)

### Estrutura e Serviços
- **Formato** - Tipo de formato da loja (proveniente da BD)
- **Área** - Área em m² (proveniente da BD)

## Funcionalidades

### Botão "Ver no mapa"
- Botão presente mas não funcional no MVP
- Ao clicar, apresenta mensagem: "Funcionalidade disponível brevemente..."
- Preparado para futura integração com mapas

### Botão "Contactar Aderente"
- Mostra os dados de contacto do aderente associado à loja
- Apresenta nome e email em alert
- Se não houver aderente associado, informa o utilizador

### Edição do Telefone
- Único campo editável na página
- Botão "Editar" ao lado do campo telefone
- Interface inline com botões "Guardar" e "Cancelar"
- Atualização em tempo real na base de dados

## Rotas

| Perfil | Rota |
|--------|------|
| Admin | `/admin/dados-da-loja` |
| DOT Team Leader | `/dot-team-leader/dados-da-loja` |
| DOT Operacional | `/dot-operacional/dados-da-loja` |
| Amont | `/amont/dados-da-loja` |

## Lógica de Apresentação de Lojas

### DOT Operacional
- Visualiza apenas as lojas que lhe estão atribuídas
- Se tiver múltiplas lojas, mostra a primeira

### Admin, DOT Team Leader, Amont
- Podem visualizar todas as lojas do sistema
- Por defeito, mostra a primeira loja disponível

### Sem lojas atribuídas
- Apresenta mensagem informativa: "Nenhuma loja disponível"
- Indica que não existe nenhuma loja atribuída ao perfil

## Arquivos Criados/Modificados

### Novos
- `pages/DadosDaLoja.tsx` - Página principal com toda a lógica

### Modificados
- `App.tsx` - Adicionadas rotas para todos os perfis
- `pages/AdminMenu.tsx` - Adicionado item de menu
- `pages/DOTTeamLeaderMenu.tsx` - Adicionado item de menu
- `pages/DotOperacionalMenu.tsx` - Adicionado item de menu
- `pages/AmontMenu.tsx` - Adicionado item de menu

## Dependências
- React
- react-router-dom (useNavigate)
- lucide-react (ícones: MapPin, Phone, Mail, AlertCircle, Store)
- services/dbAdapter (acesso à BD)
- types (Store, User, UserRole)
- utils/auth (getCurrentUser)
- components/layout/Header

## Notas Técnicas

### Estados utilizados
- `store` - Dados da loja atual
- `allUsers` - Lista de todos os utilizadores (para encontrar aderente, DOT, etc.)
- `loading` - Estado de carregamento
- `phoneEdit` - Controlo do modo de edição do telefone
- `phoneValue` - Valor temporário durante edição do telefone
- `saving` - Estado durante gravação do telefone

### Tratamento de Erros
- Redirecionamento para "/" se não houver utilizador autenticado
- Redirecionamento para "/" se for Aderente (sem permissão)
- Console.error para erros de carregamento ou gravação
- Alert para notificar utilizador em caso de erro na gravação

## Melhorias Futuras
1. Integração com API de mapas (Google Maps/OpenStreetMap)
2. Possibilidade de selecionar diferentes lojas (dropdown)
3. Edição de mais campos além do telefone
4. Histórico de alterações
5. Upload de fotos da loja
6. Visualização de métricas da loja
