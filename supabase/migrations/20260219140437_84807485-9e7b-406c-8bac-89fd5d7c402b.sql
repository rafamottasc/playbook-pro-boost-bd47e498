
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

-- 3. delete_partner_file_from_storage
CREATE OR REPLACE FUNCTION public.delete_partner_file_from_storage()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'storage' AS $$
DECLARE file_path TEXT;
BEGIN
  file_path := public.extract_storage_path(OLD.file_url);
  PERFORM set_config('storage.allow_delete_query', 'true', true);
  DELETE FROM storage.objects WHERE bucket_id = 'partner-files' AND name = file_path;
  RETURN OLD;
END; $$;

-- 4. delete_module_cover_from_storage
CREATE OR REPLACE FUNCTION public.delete_module_cover_from_storage()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'storage' AS $$
DECLARE file_path TEXT;
BEGIN
  IF OLD.cover_url IS NOT NULL THEN
    file_path := public.extract_storage_path(OLD.cover_url);
    PERFORM set_config('storage.allow_delete_query', 'true', true);
    DELETE FROM storage.objects WHERE bucket_id = 'academy-covers' AND name = file_path;
  END IF;
  RETURN OLD;
END; $$;

-- 5. cleanup_old_module_cover
CREATE OR REPLACE FUNCTION public.cleanup_old_module_cover()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'storage' AS $$
DECLARE old_path TEXT;
BEGIN
  IF OLD.cover_url IS DISTINCT FROM NEW.cover_url AND OLD.cover_url IS NOT NULL THEN
    old_path := public.extract_storage_path(OLD.cover_url);
    PERFORM set_config('storage.allow_delete_query', 'true', true);
    DELETE FROM storage.objects WHERE bucket_id = 'academy-covers' AND name = old_path;
  END IF;
  RETURN NEW;
END; $$;

-- 6. delete_resource_from_storage
CREATE OR REPLACE FUNCTION public.delete_resource_from_storage()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'storage' AS $$
DECLARE file_path TEXT;
BEGIN
  IF OLD.resource_type = 'file' AND OLD.url IS NOT NULL THEN
    file_path := public.extract_storage_path(OLD.url);
    PERFORM set_config('storage.allow_delete_query', 'true', true);
    DELETE FROM storage.objects WHERE bucket_id = 'resources' AND name = file_path;
  END IF;
  RETURN OLD;
END; $$;

-- 7. delete_lesson_attachment_from_storage
CREATE OR REPLACE FUNCTION public.delete_lesson_attachment_from_storage()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path TO 'public', 'storage' AS $$
DECLARE file_path TEXT;
BEGIN
  file_path := public.extract_storage_path(OLD.file_url);
  PERFORM set_config('storage.allow_delete_query', 'true', true);
  DELETE FROM storage.objects WHERE bucket_id = 'lesson-materials' AND name = file_path;
  RETURN OLD;
END; $$;
