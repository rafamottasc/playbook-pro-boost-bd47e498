## Diagnóstico

Testei diretamente o backend e **o cadastro funciona**: criei `teste-diag-2026@example-test.com` com sucesso (HTTP 200), trigger `handle_new_user` rodou, profile + role `corretor` foram criados.

O problema está **na camada de UI** — quando o Supabase retorna um erro real, a mensagem certa nunca chega ao usuário. Encontrei **três causas** que se combinam:

### 1. Senhas vazadas (HIBP) bloqueadas em silêncio — provavelmente a principal causa
A proteção "Leaked Password" está ativa no projeto. Testei `Password123` (que passa na validação do formulário: 8+ chars, maiúscula, minúscula, número) e o Supabase retorna:
```
HTTP 422 | error_code: "weak_password" | "Password is known to be weak and easy to guess"
```
O `useErrorHandler` não trata esse código, então o usuário vê só **"Ocorreu um erro inesperado. Tente novamente."** — sem entender que precisa escolher outra senha. Como muitos usuários reutilizam senhas comuns, **isso bloqueia a maioria dos cadastros novos**.

### 2. E-mail já cadastrado também cai no erro genérico
Supabase retorna `error_code: "user_already_exists"` com msg `"User already registered"`. A função `translateAuthError` em `src/lib/validations.ts` traduz isso para "Usuário já cadastrado", mas **nunca é chamada** no fluxo de signup. O `useErrorHandler.tsx` também não tem regra para essa mensagem → usuário vê de novo o erro genérico.

A pré-checagem de duplicidade em `Auth.tsx` (linhas 134-138) consulta `profiles` como **anônimo**, mas todas as policies SELECT exigem `authenticated`, então a query sempre retorna vazio e nunca detecta duplicado antes de chamar `signUp`.

### 3. Google Sign-In tem o mesmo problema de mensagem genérica
Erros do OAuth (exceto "Unable to exchange external code") caem direto no `handleError` genérico, sem tradução.

## Correções

**Arquivo: `src/hooks/useErrorHandler.tsx`**
- Importar `translateAuthError` de `@/lib/validations`.
- Adicionar tratamento para erros do Supabase Auth ANTES dos blocos genéricos:
  - `weak_password` / mensagem contém "weak" / "pwned" → título "Senha insegura", mensagem: "Esta senha foi encontrada em vazamentos públicos. Escolha uma senha única que você não use em outros sites."
  - `user_already_exists` / mensagem contém "already registered" → título "E-mail já cadastrado", mensagem: "Este e-mail já possui conta. Faça login ou use 'Esqueci minha senha'."
  - `over_email_send_rate_limit` → mensagem clara de aguardar.
  - Caso geral: chamar `translateAuthError(errorMessage)` para traduzir antes de mostrar.

**Arquivo: `src/pages/Auth.tsx`**
- Remover (ou tornar não-bloqueante) a pré-checagem de duplicidade nas linhas 133-154. Como a tabela `profiles` não é legível por anônimos, a checagem nunca funciona e só atrasa o fluxo. O Supabase já retorna erro de duplicado — basta exibi-lo corretamente (corrigido no item acima).
- Manter apenas a checagem de WhatsApp duplicado **opcional**, mas via uma RPC `SECURITY DEFINER` que retorne só `boolean` (recomendo remover por simplicidade).

**Arquivo: `src/lib/validations.ts`**
- Acrescentar entradas no dicionário `translateAuthError`:
  - `"Password is known to be weak and easy to guess, please choose a different one."` → "Esta senha foi encontrada em vazamentos. Escolha uma senha única."
  - `"weak_password"` (fallback)
  - `"user_already_exists"`

**Aviso preventivo no formulário de senha (UX)**
- Em `Auth.tsx`, abaixo dos requisitos de senha existentes, adicionar uma nota discreta: *"Evite senhas comuns ou reutilizadas — elas são bloqueadas por segurança."*

## Não vou mudar (e por quê)
- **Não desativar o HIBP.** É proteção de segurança importante; o problema é só a mensagem ao usuário.
- **Não alterar RLS de `profiles`** para permitir leitura anônima. Manter privacidade dos dados.
- **Não alterar o trigger `handle_new_user`** — está funcionando corretamente.

## Validação após o fix
1. Tentar cadastrar com `Password123` → deve aparecer "Esta senha foi encontrada em vazamentos…"
2. Tentar cadastrar com e-mail já existente → deve aparecer "E-mail já cadastrado…"
3. Tentar cadastrar com senha forte e nova → deve completar normalmente.
