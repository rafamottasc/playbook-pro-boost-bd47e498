-- Add location fields to campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN countries TEXT[] DEFAULT '{}',
ADD COLUMN states TEXT[] DEFAULT '{}';

-- Add comment to explain the fields
COMMENT ON COLUMN public.campaigns.countries IS 'Array of country codes (e.g., BR, US, PT)';
COMMENT ON COLUMN public.campaigns.states IS 'Array of Brazilian state codes (e.g., SC, PR, SP)';