

# Corrigir constraint do tipo de recurso no banco de dados

## Problema
O banco de dados possui uma constraint (`resources_resource_type_check`) que limita os valores aceitos na coluna `resource_type` a apenas: `pdf`, `link`, `video`, `image`. Os tipos `word` e `excel` foram adicionados na interface mas nunca foram incluidos na constraint do banco.

## Solucao
Executar uma migracao para atualizar a constraint, adicionando os tipos `word` e `excel` aos valores permitidos.

## Detalhes tecnicos

**Migracao SQL:**
```sql
ALTER TABLE public.resources DROP CONSTRAINT resources_resource_type_check;
ALTER TABLE public.resources ADD CONSTRAINT resources_resource_type_check 
  CHECK (resource_type = ANY (ARRAY['pdf', 'link', 'video', 'image', 'word', 'excel']));
```

Nenhuma alteracao de codigo e necessaria -- a interface ja suporta os dois tipos.

