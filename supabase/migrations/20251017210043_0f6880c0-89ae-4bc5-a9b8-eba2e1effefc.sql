-- Criar tabela para armazenar configurações de tema
CREATE TABLE IF NOT EXISTS public.theme_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_hue integer NOT NULL DEFAULT 160,
  primary_saturation integer NOT NULL DEFAULT 84,
  primary_lightness integer NOT NULL DEFAULT 39,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT valid_hue CHECK (primary_hue >= 0 AND primary_hue <= 360),
  CONSTRAINT valid_saturation CHECK (primary_saturation >= 40 AND primary_saturation <= 100),
  CONSTRAINT valid_lightness CHECK (primary_lightness >= 20 AND primary_lightness <= 70)
);

-- Inserir configuração padrão (verde COMARC)
INSERT INTO public.theme_settings (primary_hue, primary_saturation, primary_lightness)
VALUES (160, 84, 39)
ON CONFLICT DO NOTHING;

-- Habilitar RLS
ALTER TABLE public.theme_settings ENABLE ROW LEVEL SECURITY;

-- Política: Todos podem ler o tema
CREATE POLICY "Anyone can read theme settings"
ON public.theme_settings
FOR SELECT
USING (true);

-- Política: Apenas admins podem atualizar o tema
CREATE POLICY "Only admins can update theme settings"
ON public.theme_settings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_theme_settings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_theme_settings_updated_at
BEFORE UPDATE ON public.theme_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_theme_settings_updated_at();