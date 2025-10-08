-- Drop the problematic policy that blocks ALL operations for blocked users
DROP POLICY IF EXISTS "Blocked users cannot access campaigns" ON campaigns;

-- Recreate policy to block only write operations (not read) for blocked users
CREATE POLICY "Blocked users cannot modify campaigns"
ON campaigns
FOR INSERT
TO public
WITH CHECK (NOT is_user_blocked(auth.uid()));

CREATE POLICY "Blocked users cannot modify campaigns update"
ON campaigns
FOR UPDATE
TO public
USING (NOT is_user_blocked(auth.uid()));

CREATE POLICY "Blocked users cannot modify campaigns delete"
ON campaigns
FOR DELETE
TO public
USING (NOT is_user_blocked(auth.uid()));

-- Ensure the SELECT policy allows all authenticated users to view campaigns
DROP POLICY IF EXISTS "Authenticated users can view campaigns" ON campaigns;

CREATE POLICY "Authenticated users can view campaigns"
ON campaigns
FOR SELECT
TO public
USING (auth.uid() IS NOT NULL);