-- Create announcements table
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('info', 'warning', 'urgent', 'success')),
  icon TEXT DEFAULT 'megaphone',
  start_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  cta_text TEXT,
  cta_link TEXT,
  target_audience TEXT NOT NULL DEFAULT 'all' CHECK (target_audience IN ('all', 'corretor', 'admin')),
  active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create announcement_views table for tracking
CREATE TABLE public.announcement_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  announcement_id UUID REFERENCES public.announcements(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  dismissed BOOLEAN DEFAULT false,
  cta_clicked BOOLEAN DEFAULT false,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(announcement_id, user_id)
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcement_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for announcements
CREATE POLICY "Authenticated users can view active announcements"
ON public.announcements
FOR SELECT
USING (
  active = true 
  AND start_date <= NOW() 
  AND (end_date IS NULL OR end_date > NOW())
  AND (
    target_audience = 'all' 
    OR (target_audience = 'admin' AND has_role(auth.uid(), 'admin'::app_role))
    OR (target_audience = 'corretor' AND has_role(auth.uid(), 'corretor'::app_role))
  )
);

CREATE POLICY "Only admins can manage announcements"
ON public.announcements
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for announcement_views
CREATE POLICY "Users can view own announcement views"
ON public.announcement_views
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own announcement views"
ON public.announcement_views
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own announcement views"
ON public.announcement_views
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all announcement views"
ON public.announcement_views
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create function to get active announcements
CREATE OR REPLACE FUNCTION public.get_active_announcements()
RETURNS TABLE (
  id UUID,
  title TEXT,
  message TEXT,
  priority TEXT,
  icon TEXT,
  cta_text TEXT,
  cta_link TEXT,
  dismissed BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.message,
    a.priority,
    a.icon,
    a.cta_text,
    a.cta_link,
    COALESCE(av.dismissed, false) as dismissed
  FROM announcements a
  LEFT JOIN announcement_views av ON av.announcement_id = a.id AND av.user_id = auth.uid()
  WHERE a.active = true
    AND a.start_date <= NOW()
    AND (a.end_date IS NULL OR a.end_date > NOW())
    AND (
      a.target_audience = 'all'
      OR (a.target_audience = 'admin' AND has_role(auth.uid(), 'admin'::app_role))
      OR (a.target_audience = 'corretor' AND has_role(auth.uid(), 'corretor'::app_role))
    )
    AND COALESCE(av.dismissed, false) = false
  ORDER BY 
    CASE a.priority
      WHEN 'urgent' THEN 1
      WHEN 'warning' THEN 2
      WHEN 'info' THEN 3
      WHEN 'success' THEN 4
    END,
    a.created_at DESC
  LIMIT 1;
END;
$$;

-- Create trigger for updated_at
CREATE TRIGGER update_announcements_updated_at
BEFORE UPDATE ON public.announcements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();