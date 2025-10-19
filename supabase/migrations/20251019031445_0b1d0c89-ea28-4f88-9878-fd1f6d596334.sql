-- ============================================
-- Sistema de Limpeza Automática de Storage
-- ============================================

-- 1️⃣ FUNÇÃO AUXILIAR: Extrai path do storage a partir da URL completa
CREATE OR REPLACE FUNCTION public.extract_storage_path(file_url TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  storage_path TEXT;
BEGIN
  -- Extrai apenas o path após "/storage/v1/object/public/{bucket}/"
  -- Ex: https://.../storage/v1/object/public/partner-files/abc/file.pdf → abc/file.pdf
  storage_path := regexp_replace(file_url, '^.*/storage/v1/object/public/[^/]+/', '');
  RETURN storage_path;
END;
$$;

-- 2️⃣ TRIGGER: Limpar arquivo ao deletar partner_file
CREATE OR REPLACE FUNCTION public.delete_partner_file_from_storage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  file_path TEXT;
BEGIN
  -- Extrai path correto da URL
  file_path := public.extract_storage_path(OLD.file_url);
  
  -- Deleta do bucket partner-files
  DELETE FROM storage.objects 
  WHERE bucket_id = 'partner-files' 
    AND name = file_path;
  
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS before_delete_partner_file ON public.partner_files;
CREATE TRIGGER before_delete_partner_file
  BEFORE DELETE ON public.partner_files
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_partner_file_from_storage();

-- 3️⃣ TRIGGER: Limpar arquivo ao deletar lesson_attachment
CREATE OR REPLACE FUNCTION public.delete_lesson_attachment_from_storage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  file_path TEXT;
BEGIN
  file_path := public.extract_storage_path(OLD.file_url);
  
  DELETE FROM storage.objects 
  WHERE bucket_id = 'lesson-materials' 
    AND name = file_path;
  
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS before_delete_lesson_attachment ON public.lesson_attachments;
CREATE TRIGGER before_delete_lesson_attachment
  BEFORE DELETE ON public.lesson_attachments
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_lesson_attachment_from_storage();

-- 4️⃣ TRIGGER: Limpar cover ao deletar módulo
CREATE OR REPLACE FUNCTION public.delete_module_cover_from_storage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  file_path TEXT;
BEGIN
  IF OLD.cover_url IS NOT NULL THEN
    file_path := public.extract_storage_path(OLD.cover_url);
    
    DELETE FROM storage.objects 
    WHERE bucket_id = 'academy-covers' 
      AND name = file_path;
  END IF;
  
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS before_delete_module ON public.academy_modules;
CREATE TRIGGER before_delete_module
  BEFORE DELETE ON public.academy_modules
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_module_cover_from_storage();

-- 5️⃣ TRIGGER: Limpar cover antiga ao atualizar módulo
CREATE OR REPLACE FUNCTION public.cleanup_old_module_cover()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  old_path TEXT;
BEGIN
  -- Só limpa se cover_url mudou e o antigo existe
  IF OLD.cover_url IS DISTINCT FROM NEW.cover_url AND OLD.cover_url IS NOT NULL THEN
    old_path := public.extract_storage_path(OLD.cover_url);
    
    DELETE FROM storage.objects 
    WHERE bucket_id = 'academy-covers' 
      AND name = old_path;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cleanup_module_cover_on_update ON public.academy_modules;
CREATE TRIGGER cleanup_module_cover_on_update
  BEFORE UPDATE ON public.academy_modules
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_old_module_cover();

-- 6️⃣ TRIGGER: Limpar arquivo ao deletar resource
CREATE OR REPLACE FUNCTION public.delete_resource_from_storage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  file_path TEXT;
BEGIN
  -- Só deleta se for arquivo (não link externo)
  IF OLD.resource_type = 'file' AND OLD.url IS NOT NULL THEN
    file_path := public.extract_storage_path(OLD.url);
    
    DELETE FROM storage.objects 
    WHERE bucket_id = 'resources' 
      AND name = file_path;
  END IF;
  
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS before_delete_resource ON public.resources;
CREATE TRIGGER before_delete_resource
  BEFORE DELETE ON public.resources
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_resource_from_storage();

-- 7️⃣ TRIGGER: Limpar avatar ao deletar profile
CREATE OR REPLACE FUNCTION public.delete_profile_avatar_from_storage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  file_path TEXT;
BEGIN
  IF OLD.avatar_url IS NOT NULL THEN
    file_path := public.extract_storage_path(OLD.avatar_url);
    
    DELETE FROM storage.objects 
    WHERE bucket_id = 'avatars' 
      AND name = file_path;
  END IF;
  
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS before_delete_profile ON public.profiles;
CREATE TRIGGER before_delete_profile
  BEFORE DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.delete_profile_avatar_from_storage();

-- 8️⃣ TRIGGER: Limpar avatar antigo ao atualizar profile
CREATE OR REPLACE FUNCTION public.cleanup_old_avatar()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  old_path TEXT;
BEGIN
  IF OLD.avatar_url IS DISTINCT FROM NEW.avatar_url AND OLD.avatar_url IS NOT NULL THEN
    old_path := public.extract_storage_path(OLD.avatar_url);
    
    DELETE FROM storage.objects 
    WHERE bucket_id = 'avatars' 
      AND name = old_path;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS cleanup_avatar_on_update ON public.profiles;
CREATE TRIGGER cleanup_avatar_on_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_old_avatar();

-- 9️⃣ CRON JOB: Executar limpeza periódica todo domingo às 2h
SELECT cron.schedule(
  'cleanup-storage-weekly',
  '0 2 * * 0', -- Domingos às 2h da manhã
  $$
  SELECT net.http_post(
    url := 'https://ldnfkceonksxmybfvhco.supabase.co/functions/v1/cleanup-storage',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkbmZrY2VvbmtzeG15YmZ2aGNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk0MTU4NTYsImV4cCI6MjA3NDk5MTg1Nn0.FDIkm9M1QQLj7YEGd1RAnJgc5YnHpRBwP0rK9k1sCKY'
    ),
    body := jsonb_build_object('scheduled', true)
  ) as request_id;
  $$
);