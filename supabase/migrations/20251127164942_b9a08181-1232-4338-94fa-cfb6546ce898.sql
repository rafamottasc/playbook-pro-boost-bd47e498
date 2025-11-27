-- Recreate users_with_roles view with SECURITY INVOKER to respect RLS
DROP VIEW IF EXISTS public.users_with_roles;

CREATE VIEW public.users_with_roles 
WITH (security_invoker = true)
AS
SELECT 
    p.id,
    p.full_name,
    p.email,
    p.avatar_url,
    p.approved,
    p.blocked,
    p.team,
    p.whatsapp,
    p.gender,
    p.points,
    p.created_at,
    p.last_sign_in_at,
    COALESCE(( SELECT json_agg(ur.role) AS json_agg
           FROM user_roles ur
          WHERE ur.user_id = p.id), '[]'::json) AS roles,
    CASE
        WHEN (EXISTS ( SELECT 1
           FROM user_roles ur
          WHERE ur.user_id = p.id AND ur.role = 'admin'::app_role)) THEN true
        ELSE false
    END AS is_admin
FROM profiles p;