DROP POLICY IF EXISTS "Users can view campaign participants profiles" ON public.profiles;

CREATE POLICY "Users can view shared campaign participants profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  approved = true
  AND (blocked = false OR blocked IS NULL)
  AND EXISTS (
    SELECT 1
    FROM public.campaign_participants cp_viewer
    JOIN public.campaign_participants cp_target
      ON cp_target.campaign_id = cp_viewer.campaign_id
    WHERE cp_viewer.user_id = auth.uid()
      AND cp_target.user_id = profiles.id
  )
);