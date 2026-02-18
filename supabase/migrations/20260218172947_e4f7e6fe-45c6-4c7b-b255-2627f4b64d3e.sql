ALTER TABLE public.resources DROP CONSTRAINT resources_resource_type_check;
ALTER TABLE public.resources ADD CONSTRAINT resources_resource_type_check 
  CHECK (resource_type = ANY (ARRAY['pdf', 'link', 'video', 'image', 'word', 'excel']));