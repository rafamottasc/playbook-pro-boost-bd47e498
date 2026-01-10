-- Remover a constraint existente e recriar com ON DELETE CASCADE
ALTER TABLE public.meetings 
DROP CONSTRAINT meetings_created_by_fkey;

ALTER TABLE public.meetings 
ADD CONSTRAINT meetings_created_by_fkey 
FOREIGN KEY (created_by) REFERENCES public.profiles(id) 
ON DELETE CASCADE;