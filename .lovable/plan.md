## Diagnóstico
Logs de auth mostram login OK seguido de `POST /logout` automático. Perfil está `approved=true`, `blocked=false` — não é guard de bloqueado. A única fonte de logout automático no código são os 3 guards de `MAINTENANCE_MODE` em `useAuth.tsx`. Mesmo com a flag em `false` agora, o bundle da URL `preview--playbook-pro-boost.lovable.app` provavelmente está em cache com a versão antiga (`MAINTENANCE_MODE=true`).

## Plano — remover o modo manutenção por completo

### 1. `src/hooks/useAuth.tsx`
- Remover `import { MAINTENANCE_MODE, maintenanceError } from "@/lib/maintenanceMode"`.
- Remover helper `clearAuthStorage` (só era usado pelos guards).
- Remover os 3 blocos `if (MAINTENANCE_MODE ...)`:
  - No callback do `onAuthStateChange` (derrubava sessão nova).
  - Após `getSession()` no `initAuth` (derrubava sessão existente).
  - No topo de `signIn`, `signUp` e `signInWithGoogle` (bloqueava tentativas).

### 2. `src/lib/maintenanceMode.ts`
- Excluir o arquivo (não terá mais nenhum importador).

### 3. `.lovable/plan.md`
- Excluir o plano antigo de "bloqueio total de login" — está obsoleto e descreve exatamente o comportamento que estamos removendo.

### 4. Depois de aplicar
- Recomendar republicar para invalidar o bundle antigo em `preview--playbook-pro-boost.lovable.app` / domínio publicado.

## Resultado
Zero código capaz de disparar signOut automático. Login volta ao normal (email/senha e Google) e a sessão persiste corretamente.
