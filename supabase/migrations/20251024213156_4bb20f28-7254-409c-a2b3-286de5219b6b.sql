-- Create table for rate limiting attempts tracking
CREATE TABLE IF NOT EXISTS public.rate_limit_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('login', 'signup')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier_action_created 
ON public.rate_limit_attempts (identifier, action, created_at DESC);

-- Auto-cleanup old attempts (older than 24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.rate_limit_attempts 
  WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- Note: Enable RLS but make it accessible to the service role
ALTER TABLE public.rate_limit_attempts ENABLE ROW LEVEL SECURITY;

-- Allow service role to manage rate limits
CREATE POLICY "Service role can manage rate limits"
ON public.rate_limit_attempts
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);