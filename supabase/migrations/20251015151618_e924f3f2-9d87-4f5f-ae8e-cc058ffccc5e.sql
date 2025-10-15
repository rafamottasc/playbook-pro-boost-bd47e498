-- 1. CORRIGIR MENSAGENS ÓRFÃS EXISTENTES
UPDATE messages 
SET stage_name = 'Apresentação Produto'
WHERE stage_name = 'Apresentação do Produto' 
  AND funnel_slug = 'atendimento';

-- 2. CRIAR FUNÇÃO PARA SINCRONIZAR STAGE_NAME NAS MENSAGENS
CREATE OR REPLACE FUNCTION sync_stage_name_in_messages()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o nome da etapa mudou
  IF OLD.name IS DISTINCT FROM NEW.name THEN
    UPDATE messages
    SET stage_name = NEW.name
    WHERE stage_name = OLD.name
      AND funnel_slug = (
        SELECT slug FROM playbook_funnels WHERE id = NEW.funnel_id
      );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. CRIAR TRIGGER PARA ETAPAS
CREATE TRIGGER trigger_sync_stage_name
AFTER UPDATE OF name ON playbook_stages
FOR EACH ROW
WHEN (OLD.name IS DISTINCT FROM NEW.name)
EXECUTE FUNCTION sync_stage_name_in_messages();

-- 4. CRIAR FUNÇÃO PARA SINCRONIZAR FUNNEL_SLUG NAS MENSAGENS
CREATE OR REPLACE FUNCTION sync_funnel_slug_in_messages()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o slug do funil mudou
  IF OLD.slug IS DISTINCT FROM NEW.slug THEN
    UPDATE messages
    SET funnel_slug = NEW.slug
    WHERE funnel_slug = OLD.slug;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. CRIAR TRIGGER PARA FUNIS
CREATE TRIGGER trigger_sync_funnel_slug
AFTER UPDATE OF slug ON playbook_funnels
FOR EACH ROW
WHEN (OLD.slug IS DISTINCT FROM NEW.slug)
EXECUTE FUNCTION sync_funnel_slug_in_messages();