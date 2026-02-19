

# Corrigir erro ao excluir usuario

## Problema
A edge function `delete-user` tem `verify_jwt = true` no arquivo de configuracao. Com o sistema de signing-keys do Lovable Cloud, essa verificacao automatica nao funciona corretamente e bloqueia a requisicao antes mesmo do codigo da funcao ser executado. Isso causa o erro "edge function returned a non-2xx status code".

## Solucao
A funcao ja faz validacao de autenticacao manualmente no codigo (linhas 27-52 de `index.ts`). Basta alterar `verify_jwt` para `false` no `config.toml` e atualizar os CORS headers para incluir os headers necessarios do cliente.

## Alteracoes

### 1. `supabase/config.toml`
Alterar `verify_jwt = true` para `verify_jwt = false` na secao `[functions.delete-user]`.

### 2. `supabase/functions/delete-user/index.ts`
- Atualizar os CORS headers para incluir os headers adicionais do cliente (x-client-info, x-supabase-client-platform, etc.)
- Usar `getClaims()` em vez de `getUser()` para validacao do token (mais eficiente e compativel com signing-keys)

Nenhuma outra alteracao necessaria. A funcao ja tem toda a logica de autorizacao (verificacao de admin, protecao do primeiro admin, etc.).
