-- Habilitar realtime para playbook_funnels
ALTER PUBLICATION supabase_realtime ADD TABLE public.playbook_funnels;

-- Habilitar realtime para playbook_stages
ALTER PUBLICATION supabase_realtime ADD TABLE public.playbook_stages;