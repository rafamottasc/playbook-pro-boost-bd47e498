

# Corrigir exclusao de usuarios bloqueada por foreign keys

## Problema
A funcao de exclusao esta funcionando corretamente (o fix anterior do JWT resolveu o acesso). Porem, o banco de dados retorna "Database error deleting user" porque existem 4 foreign keys que referenciam a tabela `profiles` **sem ON DELETE CASCADE ou SET NULL**, bloqueando a exclusao em cadeia.

Foreign keys problematicas:
- `announcements.created_by` -> profiles(id) -- sem regra de delete
- `lesson_questions.answered_by` -> profiles(id) -- sem regra de delete  
- `meetings.cancelled_by` -> profiles(id) -- sem regra de delete
- `partner_files.uploaded_by` -> profiles(id) -- sem regra de delete

## Solucao
Alterar essas 4 foreign keys para usar `ON DELETE SET NULL`, preservando os registros historicos (anuncios, perguntas respondidas, reunioes canceladas, arquivos) mas removendo a referencia ao usuario deletado.

## Detalhes tecnicos

**Migracao SQL:**
```sql
-- 1. announcements.created_by
ALTER TABLE public.announcements DROP CONSTRAINT announcements_created_by_fkey;
ALTER TABLE public.announcements ADD CONSTRAINT announcements_created_by_fkey 
  FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. lesson_questions.answered_by
ALTER TABLE public.lesson_questions DROP CONSTRAINT lesson_questions_answered_by_fkey;
ALTER TABLE public.lesson_questions ADD CONSTRAINT lesson_questions_answered_by_fkey 
  FOREIGN KEY (answered_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 3. meetings.cancelled_by
ALTER TABLE public.meetings DROP CONSTRAINT meetings_cancelled_by_fkey;
ALTER TABLE public.meetings ADD CONSTRAINT meetings_cancelled_by_fkey 
  FOREIGN KEY (cancelled_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 4. partner_files.uploaded_by
ALTER TABLE public.partner_files DROP CONSTRAINT partner_files_uploaded_by_fkey;
ALTER TABLE public.partner_files ADD CONSTRAINT partner_files_uploaded_by_fkey 
  FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
```

Nenhuma alteracao de codigo e necessaria. Apos a migracao, a exclusao dos usuarios Nadia e Mariana deve funcionar normalmente.
