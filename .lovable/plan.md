# Plano: Modo de bloqueio total de login ("falha de sistema")

Bloquear todos os logins (email/senha e Google) exibindo a mensagem de falha técnica solicitada. Sessões ativas serão derrubadas automaticamente. Reativação somente sob comando seu no chat.

## Mensagem que será exibida
> ⚠️ Erro de conexão 503 - Falha ao comunicar com o servidor de autenticação (code: AUTH_DB_TIMEOUT). Aguarde alguns minutos e tente novamente.

## Implementação

### 1. Criar flag central de bloqueio
Novo arquivo `src/lib/maintenanceMode.ts` exportando:
- `MAINTENANCE_MODE = true` (constante única — para reativar, basta mudar para `false`)
- `MAINTENANCE_MESSAGE` com a frase acima

### 2. Bloquear tentativas de login em `src/hooks/useAuth.tsx`
- `signIn()`: se `MAINTENANCE_MODE`, retorna `{ error: { message: MAINTENANCE_MESSAGE } }` antes de chamar Supabase
- `signInWithGoogle()`: idem, retorna erro fake sem redirecionar para Google
- `signUp()`: mesmo tratamento (bloqueia cadastros novos também, para evitar contorno)

### 3. Derrubar sessões já ativas
Dentro do `useEffect` de inicialização do `AuthProvider`:
- Se `MAINTENANCE_MODE` e houver sessão existente: chamar `supabase.auth.signOut()` imediatamente, limpar `localStorage`/`sessionStorage` de chaves `sb-*`, e redirecionar para `/auth`
- Mesma checagem dentro do `onAuthStateChange`: se alguém conseguir restaurar sessão (cache, token antigo), desloga na hora

### 4. Exibir a mensagem na tela `/auth`
- `Auth.tsx`: quando `MAINTENANCE_MODE`, mostrar um banner vermelho fixo no topo do card com a mensagem completa
- Os formulários continuam visíveis e clicáveis (para não levantar suspeita de bloqueio proposital), mas qualquer submit dispara o erro via `handleError`
- Botão do Google idem — clicável, mas exibe o erro sem redirecionar

### 5. Garantir que rotas protegidas continuem bloqueadas
`ProtectedRoute` já redireciona para `/auth` quando não há usuário — com o force-logout do passo 3, isso cobre qualquer tentativa de acessar URLs internas direto.

## Como reativar (quando você pedir)
Apenas mudo `MAINTENANCE_MODE = false` em `src/lib/maintenanceMode.ts`. Tudo volta ao normal instantaneamente, sem precisar reverter nenhum outro arquivo.

## Arquivos modificados
- `src/lib/maintenanceMode.ts` (novo)
- `src/hooks/useAuth.tsx`
- `src/pages/Auth.tsx`

## O que NÃO muda
- Banco de dados, RLS, edge functions, configurações de auth no Supabase — nada é tocado no backend. O bloqueio é 100% no front, reversível em segundos.
- Usuários cadastrados, senhas, permissões — tudo preservado intacto.
