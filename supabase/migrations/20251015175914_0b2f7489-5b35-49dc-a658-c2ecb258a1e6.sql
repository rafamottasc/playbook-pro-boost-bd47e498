-- ============================================
-- MÓDULO DE ENQUETES
-- ============================================

-- 1. TABELA: polls
-- ============================================
CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  allow_multiple BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Apenas 'all' ou 'team:NomeDaEquipe'
  target_audience TEXT NOT NULL DEFAULT 'all', 
  
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Cache de resultados (JSON otimizado)
  results_cache JSONB DEFAULT '{}'::jsonb,
  
  CONSTRAINT valid_dates CHECK (end_date > start_date),
  CONSTRAINT valid_target_audience CHECK (
    target_audience = 'all' OR target_audience LIKE 'team:%'
  )
);

CREATE INDEX idx_polls_active ON polls(active, start_date, end_date);
CREATE INDEX idx_polls_target ON polls(target_audience);
CREATE INDEX idx_polls_created_by ON polls(created_by);

-- 2. TABELA: poll_options
-- ============================================
CREATE TABLE poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE NOT NULL,
  option_text TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT option_text_not_empty CHECK (LENGTH(TRIM(option_text)) > 0)
);

CREATE INDEX idx_poll_options_poll ON poll_options(poll_id, display_order);

-- 3. TABELA: poll_responses
-- ============================================
CREATE TABLE poll_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  option_id UUID REFERENCES poll_options(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Garante que cada usuário vote apenas uma vez por opção
  UNIQUE(poll_id, user_id, option_id)
);

CREATE INDEX idx_poll_responses_poll ON poll_responses(poll_id);
CREATE INDEX idx_poll_responses_user ON poll_responses(user_id);
CREATE INDEX idx_poll_responses_poll_user ON poll_responses(poll_id, user_id);

-- 4. TABELA: poll_views
-- ============================================
CREATE TABLE poll_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID REFERENCES polls(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(poll_id, user_id)
);

CREATE INDEX idx_poll_views_user ON poll_views(user_id);

-- ============================================
-- RLS POLICIES
-- ============================================

-- 5. RLS: polls
-- ============================================
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active polls for their audience"
ON polls FOR SELECT
TO authenticated
USING (
  active = TRUE 
  AND NOW() BETWEEN start_date AND end_date
  AND (
    target_audience = 'all'
    OR target_audience = CONCAT('team:', (
      SELECT team FROM profiles WHERE id = auth.uid()
    ))
  )
);

CREATE POLICY "Admins can manage all polls"
ON polls FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 6. RLS: poll_options
-- ============================================
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view options of visible polls"
ON poll_options FOR SELECT
TO authenticated
USING (
  poll_id IN (
    SELECT id FROM polls 
    WHERE active = TRUE 
    AND NOW() BETWEEN start_date AND end_date
    AND (
      target_audience = 'all'
      OR target_audience = CONCAT('team:', (
        SELECT team FROM profiles WHERE id = auth.uid()
      ))
    )
  )
);

CREATE POLICY "Admins can manage all poll options"
ON poll_options FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 7. RLS: poll_responses
-- ============================================
ALTER TABLE poll_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can vote on active polls"
ON poll_responses FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND poll_id IN (
    SELECT id FROM polls 
    WHERE active = TRUE 
    AND NOW() BETWEEN start_date AND end_date
    AND (
      target_audience = 'all'
      OR target_audience = CONCAT('team:', (
        SELECT team FROM profiles WHERE id = auth.uid()
      ))
    )
  )
);

CREATE POLICY "Admins can view all responses"
ON poll_responses FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete responses"
ON poll_responses FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- 8. RLS: poll_views
-- ============================================
ALTER TABLE poll_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own poll views"
ON poll_views FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own poll views"
ON poll_views FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all poll views"
ON poll_views FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================
-- TRIGGERS E FUNÇÕES
-- ============================================

-- 9. FUNÇÃO: Validar voto único (quando allow_multiple = FALSE)
-- ============================================
CREATE OR REPLACE FUNCTION validate_poll_response()
RETURNS TRIGGER AS $$
DECLARE
  poll_allows_multiple BOOLEAN;
  existing_votes INTEGER;
BEGIN
  -- Buscar configuração da enquete
  SELECT allow_multiple INTO poll_allows_multiple
  FROM polls
  WHERE id = NEW.poll_id;
  
  -- Se não permite múltiplas respostas
  IF poll_allows_multiple = FALSE THEN
    -- Contar votos existentes do usuário nesta enquete
    SELECT COUNT(*) INTO existing_votes
    FROM poll_responses
    WHERE poll_id = NEW.poll_id AND user_id = NEW.user_id;
    
    -- Se já votou, bloquear
    IF existing_votes > 0 THEN
      RAISE EXCEPTION 'Usuário já votou nesta enquete';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER poll_response_validation_trigger
BEFORE INSERT ON poll_responses
FOR EACH ROW EXECUTE FUNCTION validate_poll_response();

-- 10. FUNÇÃO: Atualizar cache de resultados
-- ============================================
CREATE OR REPLACE FUNCTION update_poll_results_cache()
RETURNS TRIGGER AS $$
DECLARE
  total_users INTEGER;
  poll_id_target UUID;
BEGIN
  poll_id_target := COALESCE(NEW.poll_id, OLD.poll_id);
  
  -- Contar total de usuários ÚNICOS que votaram
  SELECT COUNT(DISTINCT user_id) INTO total_users
  FROM poll_responses
  WHERE poll_id = poll_id_target;
  
  -- Atualizar cache com percentuais
  UPDATE polls
  SET results_cache = (
    SELECT jsonb_object_agg(
      option_id::text,
      jsonb_build_object(
        'votes', vote_count,
        'percentage', CASE 
          WHEN total_users > 0 THEN ROUND((vote_count::numeric / total_users) * 100, 1)
          ELSE 0
        END
      )
    )
    FROM (
      SELECT option_id, COUNT(*) as vote_count
      FROM poll_responses
      WHERE poll_id = poll_id_target
      GROUP BY option_id
    ) vote_counts
  ),
  updated_at = NOW()
  WHERE id = poll_id_target;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER poll_response_cache_trigger
AFTER INSERT OR DELETE ON poll_responses
FOR EACH ROW EXECUTE FUNCTION update_poll_results_cache();

-- 11. TRIGGER: Atualizar updated_at automaticamente
-- ============================================
CREATE TRIGGER poll_updated_at_trigger
BEFORE UPDATE ON polls
FOR EACH ROW EXECUTE FUNCTION update_updated_at();