# Login & Credenciais

- Autenticação por email e password; alguns utilizadores podem não ter password (modo desenvolvimento).
- Sessão guardada em localStorage (chave ontrack_auth).
- Recuperação: “Esqueci-me da password” envia token e permite redefinição.
- Verificação e redefinição de password via endpoints dedicados.
- Logout limpa a sessão local.
- Perfis determinam o dashboard inicial e menus disponíveis.
