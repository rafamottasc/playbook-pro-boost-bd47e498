-- Create campaigns table
CREATE TABLE public.campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  construtora text NOT NULL,
  empreendimento text NOT NULL,
  link_anuncio text,
  status text NOT NULL DEFAULT 'ativa',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create campaign_participants table (many-to-many relationship)
CREATE TABLE public.campaign_participants (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, user_id)
);

-- Enable RLS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_participants ENABLE ROW LEVEL SECURITY;

-- RLS Policies for campaigns
CREATE POLICY "Authenticated users can view campaigns"
  ON public.campaigns
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can manage campaigns"
  ON public.campaigns
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for campaign_participants
CREATE POLICY "Authenticated users can view participants"
  ON public.campaign_participants
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only admins can manage participants"
  ON public.campaign_participants
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();