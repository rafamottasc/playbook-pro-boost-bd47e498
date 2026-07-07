## Objetivo
Desativar o modo de manutenção e restaurar o login normal (email/senha e Google), removendo o popup de erro fake da tela de login.

## Alterações

### 1. `src/lib/maintenanceMode.ts`
- Mudar `MAINTENANCE_MODE = true` para `MAINTENANCE_MODE = false`.
- Isso já basta para:
  - Liberar `signIn`, `signUp` e `signInWithGoogle` em `useAuth.tsx` (os guards `if (MAINTENANCE_MODE) return maintenanceError()` deixam de disparar).
  - Parar de derrubar sessões ativas no `AuthProvider` (os blocos de force-logout deixam de rodar).

### 2. `src/pages/Auth.tsx`
- Remover o popup custom "estilo alerta nativo" (`.project.com diz ...`) e o `useEffect` que auto-dismissa em 10s.
- Remover o state `maintenancePopup` e qualquer trigger que abre o popup ao tentar logar.
- Garantir que os erros normais do Supabase (senha errada, email inválido, etc.) voltem a ser exibidos via `toast`/`handleError` como era antes do modo manutenção.

## Não muda
- Nada no backend (Supabase, RLS, edge functions, usuários, senhas) — o bloqueio era 100% frontend.
- Arquivo `maintenanceMode.ts` fica no projeto (só com a flag em `false`), pronto para reativar futuramente se você pedir. Se preferir remover completamente o arquivo e todas as referências, me avise.

## Resultado
Login volta ao normal instantaneamente, tela `/auth` limpa sem popup de erro, sessões existentes deixam de ser derrubadas.
