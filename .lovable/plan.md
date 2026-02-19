

# Correcao definitiva da exclusao de usuarios

## Causa raiz identificada

O banco possui um trigger de seguranca `protect_objects_delete` na tabela `storage.objects` que bloqueia qualquer `DELETE` via SQL direto, a menos que a configuracao de sessao `storage.allow_delete_query` seja `'true'`.

O fluxo que falha:

1. Edge function faz `UPDATE profiles SET avatar_url = null`
2. O trigger `cleanup_old_avatar` dispara e tenta `DELETE FROM storage.objects` -- **BLOQUEADO** pelo `protect_objects_delete`
3. O update falha silenciosamente (o codigo nao verifica o erro)
4. `avatar_url` permanece com valor original
5. `auth.admin.deleteUser()` faz cascade delete do profile
6. O trigger `before_delete_profile` dispara e tenta `DELETE FROM storage.objects` com `avatar_url` ainda preenchido -- **BLOQUEADO**
7. Erro: "Database error deleting user"

Existem 5 funcoes de trigger que fazem `DELETE FROM storage.objects` diretamente e que serao afetadas pelo mesmo problema:
- `delete_profile_avatar_from_storage` (profiles DELETE)
- `cleanup_old_avatar` (profiles UPDATE)
- `delete_partner_file_from_storage` (partner_files DELETE)
- `delete_module_cover_from_storage` (academy_modules DELETE)
- `cleanup_old_module_cover` (academy_modules UPDATE)
- `delete_resource_from_storage` (resources DELETE)
- `delete_lesson_attachment_from_storage` (lesson_attachments DELETE)

## Solucao

Corrigir todas as 7 funcoes de trigger para configurar `SET LOCAL storage.allow_delete_query = 'true'` antes de executar o DELETE, permitindo que operem corretamente com o trigger de protecao.

## Detalhes tecnicos

**Migracao SQL** - atualizar todas as funcoes para incluir `PERFORM set_config('storage.allow_delete_query', 'true', true);` antes de cada `DELETE FROM storage.objects`:

```sql
-- 1. delete_profile_avatar_from_storage
CREATE OR REPLACE FUNCTION public.delete_profile_avatar_from_storage()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'storage' AS $$
DECLARE file_path TEXT;
BEGIN
  IF OLD.avatar_url IS NOT NULL THEN
    file_path := public.extract_storage_path(OLD.avatar_url);
    PERFORM set_config('storage.allow_delete_query', 'true', true);
    DELETE FROM storage.objects WHERE bucket_id = 'avatars' AND name = file_path;
  END IF;
  RETURN OLD;
END; $$;

-- 2. cleanup_old_avatar
CREATE OR REPLACE FUNCTION public.cleanup_old_avatar()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'storage' AS $$
DECLARE old_path TEXT;
BEGIN
  IF OLD.avatar_url IS DISTINCT FROM NEW.avatar_url AND OLD.avatar_url IS NOT NULL THEN
    old_path := public.extract_storage_path(OLD.avatar_url);
    PERFORM set_config('storage.allow_delete_query', 'true', true);
    DELETE FROM storage.objects WHERE bucket_id = 'avatars' AND name = old_path;
  END IF;
  RETURN NEW;
END; $$;

-- 3-7: Mesma correcao para as demais funcoes
```

**Edge function** - simplificar `delete-user/index.ts` removendo a limpeza manual de avatar (os triggers agora funcionam corretamente):
- Remover busca de avatar_url e limpeza via Storage API
- Remover update de avatar_url para null
- Chamar diretamente `auth.admin.deleteUser(userId)`

Isso resolve nao apenas a exclusao de usuarios, mas tambem qualquer outra operacao no sistema que dependa desses triggers de limpeza de storage (ex: atualizar avatar, deletar recursos, deletar covers de modulos).

