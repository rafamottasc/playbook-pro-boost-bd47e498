-- Limpar todos os links antigos do Google Drive
UPDATE partners SET drive_link = NULL WHERE drive_link IS NOT NULL;