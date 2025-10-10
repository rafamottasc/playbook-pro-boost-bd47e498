-- Adicionar 'image' ao constraint de resource_type
ALTER TABLE public.resources 
  DROP CONSTRAINT IF EXISTS resources_resource_type_check;

ALTER TABLE public.resources 
  ADD CONSTRAINT resources_resource_type_check 
  CHECK (resource_type IN ('pdf', 'link', 'video', 'image'));